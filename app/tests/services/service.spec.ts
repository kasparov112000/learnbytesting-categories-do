import * as mocha from 'mocha';
import { assert } from 'chai';
import { CategoryService } from '../../services/category.service';
import { Category } from 'hipolito-models';

// Mock crypto.randomUUID
const mockRandomUUID = jest.fn(() => '123e4567-e89b-12d3-a456-426614174000' as `${string}-${string}-${string}-${string}-${string}`);
global.crypto = {
  ...global.crypto,
  randomUUID: mockRandomUUID
};

describe('Category Service', () => {

    let categoryService: CategoryService;

    beforeEach(() => {
        categoryService = new CategoryService({});
    });

    describe('Updating a line of service', () => {

        let lineOfService: Category;
        let lineOfServiceResult: any;

        beforeEach(() => {
            lineOfService = Object.assign(new Category(), {
                _id: '5d2f2f25e290765a7c63d56e',
                name: "Old Line of Service",
                createCreatedDate: new Date('2020-01-01T00:00:00.000Z'),
                createdDate: new Date('2020-01-01T00:00:00.000Z'),
                modifiedDate: new Date('2020-01-01T00:00:00.000Z'),
                createUuid: '325a7a4f-f655-47b6-8de8-5ab3e8f42067',
                active: true,
                children: [
                    Object.assign(new Category(), {
                        _id: '5d2f350d1f6a9b3184b82e56',
                        name: "Old Category",
                        createCreatedDate: new Date('2020-01-01T00:00:00.000Z'),
                        createdDate: new Date('2020-01-01T00:00:00.000Z'),
                        modifiedDate: new Date('2020-01-01T00:00:00.000Z'),
                        createUuid: '5f2061e1-acd3-4167-b251-f8acd2528108',
                        active: true,
                        parent: '5d2f2f25e290765a7c63d56e',
                        children: []
                    })
                ]
            });
        });

        describe('Unchanged', () => {

            beforeEach(() => {
                let duplicateLineOfService = Object.assign(new Category(), lineOfService);
                delete duplicateLineOfService._id;
                delete duplicateLineOfService.children[0]._id;
                delete duplicateLineOfService.createdDate;
                delete duplicateLineOfService.children[0].createdDate;
                delete duplicateLineOfService.modifiedDate;
                delete duplicateLineOfService.children[0].modifiedDate;

                lineOfServiceResult = categoryService.getUpdatedCategory(lineOfService, duplicateLineOfService);
            });

            it('Should not change _id', () => {
                assert.equal(lineOfService._id, lineOfServiceResult._id);
            });

            it('Should not change name', () => {
                assert.equal(lineOfService.name, lineOfServiceResult.name);
            });

            it('Should not change createCreatedDate', () => {
                assert.equal(lineOfService.createCreatedDate, lineOfServiceResult.createCreatedDate);
            });

            it('Should not change createdDate', () => {
                assert.equal(lineOfService.createdDate, lineOfServiceResult.createdDate);
            });

            it('Should not change createUuid', () => {
                assert.equal(lineOfService.createUuid, lineOfServiceResult.createUuid);
            });

            it('Should not change active', () => {
                assert.equal(lineOfService.active, lineOfServiceResult.active);
            });

            it('Should not change child parent', () => {
                assert.equal(lineOfService.children[0].parent, lineOfServiceResult.children[0].parent);
            });
        });

        describe('Changed', () => {

            beforeEach(() => {
                let newLineOfService = Object.assign(new Category(), {
                    name: "New Line of Service",
                    createCreatedDate: new Date('2025-01-01T00:00:00.000Z'),
                    createUuid: '325a7a4f-f655-47b6-8de8-5ab3e8f42067',
                    active: false,
                    children: [
                        Object.assign(new Category(), {
                            name: "New Category",
                            createCreatedDate: new Date('2025-01-01T00:00:00.000Z'),
                            createUuid: '5f2061e1-acd3-4167-b251-f8acd2528108',
                            active: false,
                            children: []
                        })
                    ]
                });

                lineOfServiceResult = categoryService.getUpdatedCategory(lineOfService, newLineOfService);
            });

            it('Should not change _id', () => {
                assert.equal(lineOfService._id, lineOfServiceResult._id);
            });

            it('Should change name', () => {
                assert.notEqual(lineOfService.name, lineOfServiceResult.name);
            });

            it('Should change createCreatedDate', () => {
                const oldDate = new Date(lineOfService.createCreatedDate).getTime();
                const newDate = new Date(lineOfServiceResult.createCreatedDate).getTime();
                assert.notEqual(oldDate, newDate);
            });

            it('Should not change createdDate', () => {
                const oldDate = new Date(lineOfService.createdDate).getTime();
                const newDate = new Date(lineOfServiceResult.createdDate).getTime();
                assert.equal(oldDate, newDate);
            });

            it('Should not change createUuid', () => {
                assert.equal(lineOfService.createUuid, lineOfServiceResult.createUuid);
            });

            it('Should change active', () => {
                assert.notEqual(lineOfService.active, lineOfServiceResult.active);
            });

            it('Should not change child parent', () => {
                assert.equal(lineOfService.children[0].parent, lineOfServiceResult.children[0].parent);
            });
        });

        describe('Children categories', () => {

            beforeEach(() => {
                let newLineOfService = Object.assign(new Category(), {
                    name: "New Line of Service",
                    createCreatedDate: new Date(1234568),
                    createUuid: '325a7a4f-f655-47b6-8de8-5ab3e8f42067',
                    active: true,
                    children: [
                        Object.assign(new Category(), {
                            name: "New Category",
                            createCreatedDate: new Date(1234568),
                            createUuid: '5f2061e1-acd3-4167-b251-f8acd2528108',
                            active: true,
                            children: [
                                Object.assign(new Category(), {
                                    name: "New SubCategory",
                                    createCreatedDate: new Date(1234564),
                                    createUuid: '5f2061e1-acd3-4167-b251-f8acd2528109',
                                    active: true,
                                    children: [
        
                                    ]
                                })
                            ]
                        })
                    ]
                });

                lineOfServiceResult = categoryService.getUpdatedCategory(lineOfService, newLineOfService);
            });

            it('Should add the child to the category', () => {
                assert.equal(lineOfService.children[0].children.length, 1);
            });

            it('Should set parent of subcategory', () => {
                assert.equal(lineOfService.children[0].children[0].parent, '5d2f350d1f6a9b3184b82e56');
            });
        });
    });
});