"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Connection {
    constructor(socket) {
        this.publisherHandlers = [];
        this.listenerHandlers = [];
        this.socket = socket;
    }
    getSocket() {
        return this.socket;
    }
    setSession(session) {
        this.janusSession = session;
    }
    getSession() {
        return this.janusSession;
    }
    addListenerHandle(handler) {
        this.listenerHandlers.push(handler);
    }
    addPublisherHandler(handler) {
        this.publisherHandlers.push(handler);
    }
    getListenerHandlers() {
        return this.listenerHandlers;
    }
    getPublisherHandles() {
        return this.publisherHandlers;
    }
}
exports.Connection = Connection;
