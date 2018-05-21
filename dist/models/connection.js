"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Connection {
    constructor(socket) {
        this.publisherHandlers = [];
        this.listenerHandlers = {};
        this.socket = socket;
    }
    setUser(id) {
        this.id = id;
    }
    getUser() {
        return this.id;
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
    addListenerHandle(handler, key) {
        this.listenerHandlers[key] = handler;
    }
    addPublisherHandler(handler) {
        this.publisherHandlers.push(handler);
    }
    getListenerHandlers() {
        return this.listenerHandlers;
    }
    getListenerHandler(key) {
        return this.listenerHandlers[key];
    }
    getPublisherHandles() {
        return this.publisherHandlers;
    }
}
exports.Connection = Connection;
