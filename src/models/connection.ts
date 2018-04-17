
export class Connection{
    private socket;
    private janusSession;
    private publisherHandlers = [];
    private listenerHandlers = [];

    constructor(socket){
        this.socket = socket;
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

    public addListenerHandle(handler){
        this.listenerHandlers.push(handler);
    }

    public addPublisherHandler(handler){
        this.publisherHandlers.push(handler);
    }

    public getListenerHandlers(){
        return this.listenerHandlers;
    }

    public getPublisherHandles(){
        return this.publisherHandlers;
    }
}