/*
 * Copyright (c) 2020 José Guerreiro. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _project = 'crm' // ! If changed, change below too!
if (!process.env.staging && !process.env.production) {
	// Running locally...
	loadEnv(_project, 'dev') // ! Change env file here
	//, 'dev'
	//, 'prod'
}
const _projectConfig = require('../_projects/crm/_config.js')
const _projectDatabase = require('../_projects/crm/database.js')
const _projectText = require('../_projects/crm/text.js')

///////////////////////

var moment = require('moment')

const _responseTimeAlert = 5000 // in ms
const _maxTokens = 6
const _cookieSettings = {
	httpOnly: true,
	secure: true,
	maxAge: moment().add(30, 'days').valueOf() / 1000,
}
const _tokenDays = 30
const _debugSockets = process.env.debugSockets
///////////////////////

const _appName = process.env.appName

//

const _simulateProduction = process.env.simulateProduction === 'true' ? true : false
const _port = process.env.PORT || 8000
const _staging = process.env.staging === 'true'
const _prod =
	_simulateProduction ||
	(process.env.production === 'true' && process.env.NODE_ENV === 'production')
const _cronServer = process.env.cronServer === 'true'
const _frontendURL = process.env.frontendURL

//

module.exports = {
	port: _port,
	responseTimeAlert: _responseTimeAlert,
	appName: _appName,
	prod: _prod,
	simulateProduction: _simulateProduction,
	cronServer: _cronServer,
	staging: _staging,
	frontendURL: _frontendURL,
	maxTokens: _maxTokens,
	debugSockets: _debugSockets,
	cookieSettings: _cookieSettings,
	tokenDays: _tokenDays,

	//

	jwtSecret: process.env.jwtSecret,
	adminPassword: process.env.adminPassword,
	saltRounds: 10,

	//

	databaseURL: process.env.databaseURL,

	//

	recaptchaSecretKey: process.env.recaptchaSecretKey,
	recaptchaBypass: process.env.recaptchaBypass,

	//

	bucketAccessID: process.env.bucketAccessID,
	bucketAccessSecret: process.env.bucketAccessSecret,
	bucketEndpoint: process.env.bucketEndpoint,
	bucketName: process.env.bucketName,
	imageThumbnailWidth: 200,

	publicUploadsPath: process.env.bucketFolder + '/public_uploads' + (_prod ? '_prod' : '_dev'),
	privateUploadsPath: process.env.bucketFolder + '/private_uploads' + (_prod ? '_prod' : '_dev'),

	//

	sentryID: process.env.sentryID,

	postmarkKey: process.env.postmarkKey,

	pushNotificationsKey: process.env.pushNotificationsKey,

	nexmo: {
		ID: process.env.nexmoID,
		token: process.env.nexmoToken,
		phoneNumber: _appName,
	},

	/////////////////////////////////

	response: function (id, req, obj) {
		return (obj && obj[id][req.lang]) || _projectText.responses[id][req.lang]
	},
	text: function (id, req, obj) {
		return (obj && obj[id][req.lang]) || _projectText.messages[id][req.lang]
	},

	project: _project,
	projectDatabase: _projectDatabase,
	..._projectConfig,
}

function loadEnv(_project, env) {
	var envPath = './app/_projects/' + _project + '/_' + env + '.env'
	console.log('\nRunning ' + env.toUpperCase() + ' locally: ' + envPath)
	require('dotenv').config({ path: envPath })
}