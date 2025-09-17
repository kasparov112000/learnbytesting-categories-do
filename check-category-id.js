const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://dbAdmin:ramos111@cluster0.tvmkw.mongodb.net/mdr-categories?retryWrites=true';

async function checkCategoryId() {
    try {
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('categories');
        
        // Check for the specific ID
        const targetId = '68c4fa3dc3bfc33a5352852b';
        console.log(`\nSearching for document with _id: ${targetId}`);
        
        // Try different ways to find the document
        const doc1 = await collection.findOne({ _id: targetId });
        console.log('Found by string _id:', !!doc1);
        
        // Try with regex in case there's whitespace
        const doc2 = await collection.findOne({ _id: { $regex: targetId } });
        console.log('Found by regex:', !!doc2);
        
        // Get all documents and check their IDs
        console.log('\nAll documents in collection:');
        const allDocs = await collection.find({}).toArray();
        
        allDocs.forEach(doc => {
            console.log(`- _id: "${doc._id}" (type: ${typeof doc._id}), name: ${doc.name}`);
            console.log(`  _id equals target? ${doc._id === targetId}`);
            console.log(`  _id toString equals target? ${String(doc._id) === targetId}`);
        });
        
        // Check if any document contains this ID in children
        console.log('\nChecking if ID exists in children arrays:');
        for (const doc of allDocs) {
            if (doc.children && Array.isArray(doc.children)) {
                const hasChildWithId = doc.children.some(child => 
                    child._id === targetId || String(child._id) === targetId
                );
                if (hasChildWithId) {
                    console.log(`Found in children of document: ${doc._id} (${doc.name})`);
                }
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkCategoryId();