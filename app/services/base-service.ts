import { Model, Document, Connection, Schema } from 'mongoose';
import { cloneDeep } from 'lodash';

export abstract class BaseService<TModel> {
    public model: Model<any>;

    constructor(public readonly connection: Connection, protected readonly schema: Schema, protected readonly collectionName: string) {
        this.model = this.connection.model<any>(this.collectionName, this.schema);
    }

    // public async create(document: TModel, options?: any): Promise<TModel> {
    //     const documentClone:any = cloneDeep(document);
    //     return await this.model.create(documentClone, options);
    // }

    public async find(options?: any): Promise<Array<TModel>> {
        return await this.model.find(options).lean();
    }

    public async findOne(query: any): Promise<TModel> {
        return await this.model.findOne(query).lean();
    }

    public async update(query: any, document: TModel) {
        const queryClone = cloneDeep(query);
        const documentClone = cloneDeep(query);
        return await this.model.update(queryClone, documentClone).lean();
    }

    public async upsert(query: any, document: TModel, options: any = { upsert: true }) {
        return await this.model.update(query, document, options).lean();
    }

    public async deleteOne(query: any, options?: any) {
        return await this.model.deleteOne(query, options).lean();
    }

    protected async doesDataExist(): Promise<boolean> {
        const data = await this.model.findOne();
        if (data) {
            return true;
        } else {
            return false;
        }
    }

    protected async createSeedData(data: Array<TModel>): Promise<void> {
        try {
            await this.model.insertMany(data);
        } catch (error) {
            throw new Error(error);        
        }
    }
}
