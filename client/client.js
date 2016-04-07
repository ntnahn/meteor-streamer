/* globals DDPCommon, EV, radio:true */
/* exported radio */

class RadioStation extends EV {
	constructor() {
		super();

		Meteor.connection._stream.on('message', (raw_msg) => {
			const msg = DDPCommon.parseDDP(raw_msg);
			if (msg && msg.msg === 'changed' && msg.collection && msg.fields && msg.fields.eventName && msg.fields.args) {
				console.log(raw_msg);
				msg.fields.args.unshift(msg.fields.eventName);
				msg.fields.args.unshift(msg.collection);
				this.emit.apply(this, msg.fields.args);
			}
		});
	}
}

Meteor.RadioStation = new RadioStation;


Meteor.Radio = class Radio extends EV {
	constructor(name) {
		super();

		console.log('constructor', name);

		this.name = name;
		this.subscriptions = {};

		Meteor.RadioStation.on(this.subscriptionName, (...args) => {
			if (this.subscriptions[args[0]]) {
				this.emit.apply(this, args);
			}
		});
	}

	get subscriptionName() {
		return `stream-${this.name}`;
	}

	unsubscribe(eventName) {
		delete this.subscriptions[eventName];
	}

	subscribe(eventName) {
		console.log('subscribe', eventName);
		return Meteor.subscribe(this.subscriptionName, eventName, {
			onStop: () => {
				console.log('onStop');
				this.unsubscribe(eventName);
			}
		});
	}

	on(eventName, callback) {
		console.log('on', eventName);
		if (!this.subscriptions[eventName]) {
			this.subscriptions[eventName] = {
				subscription: this.subscribe(eventName)
			};
		}

		super(eventName, callback);
	}
};


radio = new Meteor.Radio('chat');

radio.on('message', function(message) {
	console.log('message: ' + message);
});

radio.on('stop', function(message) {
	console.log('stop: ' + message);
});
