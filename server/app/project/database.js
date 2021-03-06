/*
 * Copyright (c) 2020 José Guerreiro. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const mongoose = require('mongoose')
const mongooseLeanId = require('mongoose-lean-id')
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')
var cachegoose = require('cachegoose')
var validator = require('validator').default
cachegoose(mongoose, {
	//engine: 'redis',    /* If you don't specify the redis engine,      */
	//port: 6379,         /* the query results will be cached in memory. */
	//host: 'localhost'
})

var emailValidator = {
	validator: (v) => (v ? validator.isEmail(v) : true),
	message: (v) => `${v.value} is not a valid e-mail!`,
}

///////////////////////

/**
 * @param schema
 * @param id
 * @param arrayName
 * @param sortObject
 * @param objectsArray
 */
async function unshiftToArray(schema, id, arrayName, sortObject, objectsArray = []) {
	var o = { $push: {} }
	o['$push'][arrayName] = {
		$each: objectsArray,
		$position: 0,
		$sort: sortObject,
	}
	await schema.updateOne(
		{
			_id: id,
		},
		o
	)
}
/**
 * @param schema
 * @param id
 * @param arrayName
 * @param key
 * @param keysArray
 */
async function removeFromArray(schema, id, arrayName, key, keysArray = []) {
	var o = { $pull: {} }
	o['$pull'][arrayName] = {}
	o['$pull'][arrayName][key] = {
		$in: keysArray,
	}
	await schema.updateOne(
		{
			_id: id,
		},
		o
	)
}
global.unshiftToArray = unshiftToArray
global.removeFromArray = removeFromArray

var ClientSchema = new mongoose.Schema({
	// _id

	email: {
		type: String,
		trim: true,
		index: true,
		unique: true,
		required: true,
		set: (v) => (v ? v.toLowerCase() : undefined),
		validate: emailValidator,
	},
	phone: {
		type: String,
		trim: true,
		index: true,
		//unique: true,
		//required: true,
	},
	permission: { type: Number, default: 100 },
	// 0 == Super admin, Admin <= 10, User <= 100

	reference: {
		type: Number,
		trim: true,
		index: true,
		unique: true,
		required: true,
	},

	state: { type: String, enum: ['pending', 'active', 'canceled'] /* default: 'pending' */ },
	flags: [{ type: String, enum: ['suspended', 'verified'] }],
	contexts: [{ type: String, enum: ['manager'] }],

	personal: {
		select: false,

		firstName: String,
		lastName: String,
		photoURL: String,
		country: String,
		countryPhoneCode: String,
	},

	access: {
		select: false,

		hashedPassword: { type: String },
		activeTokens: [String],
	},

	settings: {
		select: false,

		language: { type: String, enum: ['en', 'pt'] },
	},

	appState: {
		select: false,

		verificationCode: Number,
		lastUnreadChatEmail: Date,
		mobileNotificationDevices: [String],
	},

	timestamps: {
		select: false,

		created: {
			date: { type: Date, default: Date.now },
			by: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
		},
		lastCall: Date,
	},

	arrays: {
		select: false,

		notifications: [
			{
				_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
				isRead: { type: Boolean, default: false },
				date: { type: Date, default: Date.now },
				notificationType: { type: String, enum: ['gotCoupon', 'postLiked'] },
				data: mongoose.Schema.Types.Mixed, // Any object
				// postLiked example
				/*
				{
					client, (_id)
					post, (_id)
				}
				*/
			},
		],

		friends: [
			{
				_id: false,
				client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
				addedDate: { type: Date, default: Date.now },
				blocked: { type: Boolean, default: false },
			},
		],
	},
})
	// ! TO CREATE COMPOUND OR TEXT INDEXES
	.index({
		'personal.firstName': 'text',
		'personal.lastName': 'text',
	})
	.index({
		'flags.verified': 1,
	})
	.plugin(mongooseLeanId)
	.plugin(mongooseLeanVirtuals)
// ! TO ADD GENERATED FIELDS
ClientSchema.virtual('personal.fullName').get(function () {
	return !this.personal.firstName && !this.personal.lastName
		? undefined
		: `${this.personal.firstName} ${this.personal.lastName}`
})
// ! TO ADD METHODS
// ClientSchema.methods.findSimilarType = function (cb) {
//   return this.model('Animal').find({ type: this.type }, cb);
// };
var Client = mongoose.model('Client', ClientSchema)
global.clientNotification = async (notificationType, clientID, data = {}) => {
	await unshiftToArray(Client, clientID, 'arrays.notifications', { date: -1 }, [
		{
			isRead: false,
			date: Date.now(),
			notificationType: notificationType,
			data: data,
		},
	])
}

var Chat = mongoose.model(
	'Chat',
	new mongoose.Schema({
		// _id

		state: { type: String, enum: ['active', 'closed'], default: 'active' },
		flags: [{ type: String, enum: ['suspended'] }],
		contexts: [{ type: String, enum: ['private'] }],

		timestamps: {
			select: false,

			created: {
				date: { type: Date, default: Date.now },
				by: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
			},
		},

		arrays: {
			select: false,

			clients: [
				{
					client: {
						type: mongoose.Schema.Types.ObjectId,
						ref: 'Client',
						required: true,
					},
				},
			],

			messages: [
				{
					_id: { type: mongoose.Schema.Types.ObjectId, auto: true },

					sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

					date: { type: Date, default: Date.now },
					text: String,
					readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' }],

					attachments: [
						{
							URL: String,
							fileName: String,
							fileType: String,
						},
					],
				},
			],
		},
	})
		.plugin(mongooseLeanId)
		.plugin(mongooseLeanVirtuals)
)

//

var City = mongoose.model(
	'City',
	new mongoose.Schema({
		// _id
		countryCode: { required: true, type: String },
		name: { required: true, type: String },
		code: { required: true, unique: true, type: String },
	})
		.plugin(mongooseLeanId)
		.plugin(mongooseLeanVirtuals)
)

//

var RemoteConfig = mongoose.model(
	'RemoteConfig',
	new mongoose.Schema({
		// _id
		code: { required: true, unique: true, type: String, default: 'general' },

		maintenanceMode: { type: Boolean, default: false },

		publicMessage: {
			active: { type: Boolean, default: false },
			text: String,
			messageType: String, // scheduled_maintenance, warning, new_feature...
		},
	})
		.plugin(mongooseLeanId)
		.plugin(mongooseLeanVirtuals)
)
global.structures = [
	{
		sendToFrontend: true,
		cache: false,
		sortKey: 'name',
		schema: RemoteConfig,
		path: '/structures/remote_config.json',
		//overrideJson: false,
		//postProcess: (array)
	},
]

//

module.exports = {
	Client,
	Chat,

	//

	City,

	//

	RemoteConfig,
}
