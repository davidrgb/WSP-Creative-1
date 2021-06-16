export class Reply {
    constructor(data) {
        this.threadId = data.threadId;
        this.uid = data.uid;
        this.email = data.email;
        this.timestamp = data.timestamp;
        this.content = data.content;
    }

    serialize() {
        return {
            threadId: this.threadId,
            uid: this.uid,
            email: this.email,
            timestamp: this.timestamp,
            content: this.content,
        }
    }

    validate_reply() {
        if (this.content && this.content.length > 4) return null;
        return 'invalid: min length should be 5';
    }
}