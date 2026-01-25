/**
 * Migration script to populate embedded translations for all categories
 *
 * This script:
 * 1. Fetches all categories from MongoDB
 * 2. Collects all category names (including nested children)
 * 3. Batch translates them to Spanish via the translation API
 * 4. Updates each category with embedded translations
 *
 * Usage:
 *   node scripts/migrate-category-translations.js
 *
 * Prerequisites:
 *   - MongoDB must be running
 *   - Translation service must be running on port 3035
 */

const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learnbytesting';
const TRANSLATION_API = process.env.TRANSLATION_API || 'http://localhost:3035';
const TARGET_LANG = 'es';
const BATCH_SIZE = 50;

// Category schema (simplified for migration)
const CategorySchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.Mixed },
  name: { type: String, required: true },
  translations: {
    es: { type: String },
    pt: { type: String },
    fr: { type: String },
    de: { type: String }
  },
  children: [{ type: mongoose.Schema.Types.Mixed }],
  isActive: { type: Boolean, default: true }
}, { collection: 'categories', strict: false });

const Category = mongoose.model('Category', CategorySchema);

/**
 * Recursively collect all category names from the tree
 */
function collectAllNames(categories, result = []) {
  for (const cat of categories) {
    if (cat.name && cat._id) {
      result.push({
        id: cat._id.toString(),
        name: cat.name,
        hasTranslation: !!(cat.translations && cat.translations[TARGET_LANG])
      });
    }
    if (cat.children && cat.children.length) {
      collectAllNames(cat.children, result);
    }
  }
  return result;
}

/**
 * Batch translate names via translation API
 */
async function translateBatch(names) {
  try {
    const response = await axios.post(`${TRANSLATION_API}/translate/batch`, {
      texts: names,
      source_lang: 'en',
      target_lang: TARGET_LANG,
      use_glossary: true
    });
    return response.data.translations || response.data;
  } catch (error) {
    console.error(`Translation API error: ${error.message}`);
    // Return original names on error
    return names;
  }
}

/**
 * Update categories with translations in MongoDB
 */
async function updateCategoriesWithTranslations(translations) {
  const bulkOps = translations.map(item => ({
    updateOne: {
      filter: { _id: item.id },
      update: {
        $set: {
          [`translations.${TARGET_LANG}`]: item.translation
        }
      }
    }
  }));

  if (bulkOps.length === 0) {
    return { modifiedCount: 0 };
  }

  return await Category.bulkWrite(bulkOps);
}

/**
 * Also update nested children translations in parent documents
 */
async function updateNestedChildrenTranslations(categories, translationMap) {
  const bulkOps = [];

  for (const cat of categories) {
    if (cat.children && cat.children.length) {
      const updatedChildren = updateChildrenRecursively(cat.children, translationMap);
      bulkOps.push({
        updateOne: {
          filter: { _id: cat._id },
          update: { $set: { children: updatedChildren } }
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    return await Category.bulkWrite(bulkOps);
  }
  return { modifiedCount: 0 };
}

function updateChildrenRecursively(children, translationMap) {
  return children.map(child => {
    const childObj = child.toObject ? child.toObject() : { ...child };
    const childId = childObj._id ? childObj._id.toString() : '';

    if (childId && translationMap.has(childId)) {
      childObj.translations = childObj.translations || {};
      childObj.translations[TARGET_LANG] = translationMap.get(childId);
    }

    if (childObj.children && childObj.children.length) {
      childObj.children = updateChildrenRecursively(childObj.children, translationMap);
    }

    return childObj;
  });
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('='.repeat(60));
  console.log('Category Translation Migration');
  console.log('='.repeat(60));
  console.log(`MongoDB: ${MONGODB_URI}`);
  console.log(`Translation API: ${TRANSLATION_API}`);
  console.log(`Target Language: ${TARGET_LANG}`);
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB
    console.log('\n1. Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('   Connected successfully.');

    // Fetch all categories
    console.log('\n2. Fetching categories...');
    const categories = await Category.find({}).lean();
    console.log(`   Found ${categories.length} root categories.`);

    // Collect all names (including nested)
    console.log('\n3. Collecting all category names...');
    const allNames = collectAllNames(categories);
    console.log(`   Total categories (including nested): ${allNames.length}`);

    // Filter out ones that already have translations
    const needsTranslation = allNames.filter(n => !n.hasTranslation);
    console.log(`   Already have translations: ${allNames.length - needsTranslation.length}`);
    console.log(`   Need translation: ${needsTranslation.length}`);

    if (needsTranslation.length === 0) {
      console.log('\n   All categories already have translations. Nothing to do.');
      return;
    }

    // Batch translate
    console.log('\n4. Translating category names...');
    const translationResults = [];

    for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
      const batch = needsTranslation.slice(i, i + BATCH_SIZE);
      const names = batch.map(n => n.name);

      console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: Translating ${names.length} names...`);
      const translations = await translateBatch(names);

      batch.forEach((item, idx) => {
        translationResults.push({
          id: item.id,
          name: item.name,
          translation: translations[idx]
        });
      });

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < needsTranslation.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Build translation map
    const translationMap = new Map();
    translationResults.forEach(item => {
      translationMap.set(item.id, item.translation);
    });

    // Update root categories
    console.log('\n5. Updating root categories in MongoDB...');
    const rootResult = await updateCategoriesWithTranslations(translationResults);
    console.log(`   Updated ${rootResult.modifiedCount} root category documents.`);

    // Update nested children
    console.log('\n6. Updating nested children in parent documents...');
    const nestedResult = await updateNestedChildrenTranslations(categories, translationMap);
    console.log(`   Updated ${nestedResult.modifiedCount} parent documents with child translations.`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Migration Complete!');
    console.log('='.repeat(60));
    console.log(`Total categories processed: ${allNames.length}`);
    console.log(`Translations added: ${translationResults.length}`);
    console.log(`Root docs updated: ${rootResult.modifiedCount}`);
    console.log(`Parent docs updated (nested): ${nestedResult.modifiedCount}`);

    // Sample output
    console.log('\nSample translations:');
    translationResults.slice(0, 5).forEach(item => {
      console.log(`   "${item.name}" → "${item.translation}"`);
    });

  } catch (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

// Run migration
migrate().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
