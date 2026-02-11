import { CategoryService } from '../../services/category.service';
import { Category } from 'hipolito-models';

// Properly mock both crypto and uuid modules
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000')
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000')
}));

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
                expect(lineOfServiceResult._id).toBe(lineOfService._id);
            });

            it('Should not change name', () => {
                expect(lineOfServiceResult.name).toBe(lineOfService.name);
            });

            it('Should not change createCreatedDate', () => {
                expect(lineOfServiceResult.createCreatedDate.getTime()).toBe(lineOfService.createCreatedDate.getTime());
            });

            it('Should not change createdDate', () => {
                expect(lineOfServiceResult.createdDate.getTime()).toBe(lineOfService.createdDate.getTime());
            });

            it('Should not change createUuid', () => {
                expect(lineOfServiceResult.createUuid).toBe(lineOfService.createUuid);
            });

            it('Should not change active', () => {
                expect(lineOfServiceResult.active).toBe(lineOfService.active);
            });

            it('Should not change child parent', () => {
                expect(lineOfServiceResult.children[0].parent).toBe(lineOfService.children[0].parent);
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

                const existingDate = new Date('2020-01-01T00:00:00.000Z');
                const newDate = new Date('2025-01-01T00:00:00.000Z');
                lineOfService.createCreatedDate = existingDate;
                newLineOfService.createCreatedDate = newDate;

                lineOfServiceResult = categoryService.getUpdatedCategory(lineOfService, newLineOfService);
            });

            it('Should not change _id', () => {
                expect(lineOfServiceResult._id).toBe(lineOfService._id);
            });

            it('Should change name', () => {
                expect(lineOfServiceResult.name).not.toBe(lineOfService.name);
            });

            it('Should not change createCreatedDate', () => {
                expect(lineOfServiceResult.createCreatedDate.getTime()).toBe(lineOfService.createCreatedDate.getTime());
            });

            it('Should not change createdDate', () => {
                const oldDate = new Date(lineOfService.createdDate).getTime();
                const newDate = new Date(lineOfServiceResult.createdDate).getTime();
                expect(newDate).toBe(oldDate);
            });

            it('Should not change createUuid', () => {
                expect(lineOfServiceResult.createUuid).toBe(lineOfService.createUuid);
            });

            it('Should change active', () => {
                expect(lineOfServiceResult.active).not.toBe(lineOfService.active);
            });

            it('Should not change child parent', () => {
                expect(lineOfServiceResult.children[0].parent).toBe(lineOfService.children[0].parent);
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
                                    children: []
                                })
                            ]
                        })
                    ]
                });

                lineOfServiceResult = categoryService.getUpdatedCategory(lineOfService, newLineOfService);
            });

            it('Should add the child to the category', () => {
                expect(lineOfServiceResult.children[0].children.length).toBe(1);
            });

            it('Should set parent of subcategory', () => {
                expect(lineOfServiceResult.children[0].children[0].parent).toBe('5d2f350d1f6a9b3184b82e56');
            });
        });
    });
});
