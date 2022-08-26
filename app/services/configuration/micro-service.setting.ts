export class MicroServiceSetting {
    public name: string;
    public url: string;
    public port: string; 

    constructor(params: { name: string, url: string, port: string }) {
        this.name = params.name;
        this.url = params.url;
        this.port = params.port;
    }
}