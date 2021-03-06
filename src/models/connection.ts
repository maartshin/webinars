
export class Connection{
    private socket;
    private janusSession;
    private publisherHandlers = [];
    private listenerHandlers = {};
    private id;

    constructor(socket){
        this.socket = socket;
    }

    public setUser(id){
        this.id = id;
    }

    public getUser(){
        return this.id;
    }

    public getSocket(){
        return this.socket;
    }
    
    public setSession(session){
        this.janusSession = session;
    }
    
    public getSession(){
        return this.janusSession;
    }

    public addListenerHandle(handler, key){
        this.listenerHandlers[key] = handler;
    }

    public addPublisherHandler(handler){
        this.publisherHandlers.push(handler);
    }

    public getListenerHandlers(){
        return this.listenerHandlers;
    }

    public getListenerHandler(key){
        return this.listenerHandlers[key];
    }

    public getPublisherHandles(){
        return this.publisherHandlers;
    }
}