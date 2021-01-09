/*
 * Copyright (c) 2020 José Guerreiro. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react'
import io from 'socket.io-client'
import MediaQuery from 'react-responsive'
import { get } from 'core/api'
import { Fade } from 'react-reveal'
import { Helmet } from 'react-helmet'
import CustomButton from '../components/CustomButton'
import GenericModal from './GenericModal'
import { confirmAlert } from 'react-confirm-alert'
import RouterBase from 'core/components/RouterBase'

var styles = require('core/styles').default
var config = require('core/config_').default

global.sleep = function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

global.genericModal = function ({ title, content, buttons, color, style }) {
	confirmAlert({
		willUnmount: () => {},
		onClickOutside: () => {},
		onKeypressEscape: () => {},
		closeOnEscape: true,
		closeOnClickOutside: false,
		customUI: ({ onClose }) => {
			return (
				<GenericModal
					onClose={onClose}
					title={title}
					buttons={buttons}
					color={color}
					content={content}
					style={style}
				></GenericModal>
			)
		},
	})
}

export default class AppBase extends Component {
	state = {
		socketConnectionDelay: false,
		isReconnect: false,
		oldBuild: false,
		hideWarnings: false,
	}

	constructor() {
		super()

		global.toggleNightMode = this.toggleNightMode.bind(this)

		global.hideWarnings = this.hideWarnings.bind(this)

		global.changeBackground = this.changeBackground.bind(this)

		if (config.darkModeAvailable) {
			var isDark = window.matchMedia('(prefers-color-scheme: dark)')
			if (global.storage.getItem('nightMode') !== null)
				/*eslint-disable */
				this.applyNightMode(global.storage.getItem('nightMode') == 'true', true)
			/*eslint-enable */
			// ! Don't change to ===
			else this.applyNightMode(isDark && isDark.matches, true)
		} else this.applyNightMode(false, true)

		if (config.websocketSupport) {
			if (global.socket) {
				global.socket.removeAllListeners()
				global.socket.close()
			}
			global.socket = io(config.websocketURL, { autoConnect: false })
			global.socket.on(
				'connect',
				function () {
					console.log('Socket connected: ' + global.socket.id)
					this.forceUpdate()

					var token = global.storage.getItem('token')
					global.socket.emit('init', { token: token }, (res) => {
						if (res.success) {
							console.log('Connected to websocket! Build number: ' + res.buildNumber)

							var buildNumber = global.storage.getItem('build_number')
							global.storage.setItem('build_number', res.buildNumber)
							if (
								this.state.isReconnect &&
								buildNumber &&
								res.buildNumber !== buildNumber
							) {
								this.setState({ oldBuild: true })
							}

							if (!this.state.isReconnect) this.setState({ isReconnect: true })
						}
					})
				}.bind(this)
			)
			global.socket.on(
				'disconnect',
				function () {
					console.warn('Websocket disconnected!')
					this.forceUpdate()
				}.bind(this)
			)
			setTimeout(
				function () {
					this.setState({ socketConnectionDelay: true })
				}.bind(this),
				3000
			)
		}

		var lang = global.storage.getItem('lang')
		if (lang) {
			global.setLang(JSON.parse(lang))
		}
	}

	hideWarnings = function () {
		this.setState({ hideWarnings: true })
	}
	toggleNightMode = function (night) {
		if (night === undefined) night = !this.state.nightMode

		global.storage.setItem('nightMode', night)
		this.applyNightMode(night)
	}
	applyNightMode = function (night, skipPageRefresh = false) {
		this.state.nightMode = night
		global.nightMode = night
		if (!skipPageRefresh) window.location.reload()
		else {
			if (night) {
				this.changeBackground(styles.colors.backgroundNight)
				document.body.style.color = styles.colors.blackNight
				document.body.style.caretColor = 'rgba(255, 255, 255, 0.5)'
				styles.colors.background = styles.colors.backgroundNight
				styles.colors.white = styles.colors.whiteNight
				styles.colors.black = styles.colors.blackNight
				styles.colors.borderColor = styles.colors.borderColorNight
				styles.colors.lineColor = styles.colors.lineColorNight
				styles.card.background = styles.colors.whiteNight
				styles.card.borderColor = styles.colors.borderColorNight
				styles.outlineCard.borderColor = styles.colors.borderColorNight
			} else {
				this.changeBackground(styles.colors.backgroundDay)
				document.body.style.color = styles.colors.blackDay
				document.body.style.caretColor = 'rgba(0, 0, 0, 0.5)'
				styles.colors.background = styles.colors.backgroundDay
				styles.colors.white = styles.colors.whiteDay
				styles.colors.black = styles.colors.whiteNight
				styles.colors.borderColor = styles.colors.borderColorDay
				styles.colors.lineColor = styles.colors.lineColorDay
				styles.card.background = styles.colors.whiteDay
				styles.card.borderColor = styles.colors.borderColorDay
				styles.outlineCard.borderColor = styles.colors.borderColorDay
			}
		}
	}
	changeBackground = function (color) {
		document.body.style.backgroundColor = color
	}

	render() {
		var cookieNotice = global.storage.getItem('cookie_notice') || this.state.hideWarnings

		var inRestrictedRoute = false
		config.restrictedRoutes.forEach((r) => {
			if (window.location.href.includes(r)) inRestrictedRoute = true
		})

		var Child = this.props.component

		return (
			<MediaQuery minWidth={config.mobileWidthTrigger}>
				{(desktop) => (
					<div>
						<Helmet>
							<title>{config.title() + config.separator + config.phrase()}</title>
							<meta name='description' content={config.description()} />
							<link rel='canonical' href={config.domain} />
							<meta property='og:url' content={config.domain} />
						</Helmet>

						{inRestrictedRoute && this.state.oldBuild && !this.state.hideWarnings && (
							<div style={{ maxHeight: 0 }}>
								<Fade delay={1000} duration={500} bottom>
									<div
										style={{
											display: 'flex',
											minWidth: '100vw',
											minHeight: 50,
											padding: 5,
											position: 'fixed',
											overflow: 'hidden',
											bottom: 0,
											zIndex: 8,
											background: 'rgba(30,30,30,.9)',
											textAlign: 'center',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<div></div>

										<p
											style={{
												fontSize: 12,
												opacity: 0.75,
												color: 'white',
											}}
										>
											{config.text('extras.newUpdate')}
										</p>

										<CustomButton
											appearance='primary'
											style={{
												marginLeft: 15,
												minHeight: 30,
												fontSize: 12,
												minWidth: 0,
											}}
											onClick={() => {
												window.location.reload()
											}}
										>
											REFRESH
										</CustomButton>

										<div></div>
									</div>
								</Fade>
							</div>
						)}
						{inRestrictedRoute &&
							!global.socket.connected &&
							this.state.socketConnectionDelay &&
							!this.state.hideWarnings && (
								<div style={{ maxHeight: 0 }}>
									<Fade delay={1000} duration={500} bottom>
										<div
											style={{
												display: 'flex',
												minWidth: '100vw',
												minHeight: 50,
												padding: 5,
												position: 'fixed',
												overflow: 'hidden',
												bottom: 0,
												zIndex: 8,
												background: styles.colors.red,
												textAlign: 'center',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<p style={{ color: 'white' }}>
												{config.text('extras.connectionLost')}
											</p>
										</div>
									</Fade>
								</div>
							)}
						{config.showCookieNotice && cookieNotice !== 'true' && (
							<div style={{ maxHeight: 0 }}>
								<Fade delay={1000} duration={500} bottom>
									<div
										style={{
											display: 'flex',
											minWidth: '100vw',
											minHeight: 50,
											padding: 5,
											position: 'fixed',
											overflow: 'hidden',
											bottom: 0,
											zIndex: 8,
											background: 'rgba(30,30,30,.9)',
											textAlign: 'center',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<div></div>

										<p
											style={{
												fontSize: 12,
												opacity: 0.75,
												color: 'white',
											}}
										>
											{config.text('common.cookieWarning')}
										</p>

										<CustomButton
											appearance='primary'
											style={{
												marginLeft: 15,
												minHeight: 30,
												fontSize: 12,
												minWidth: 0,
											}}
											onClick={() => {
												global.storage.setItem('cookie_notice', 'true')
												this.setState({
													hideCookieNotice: true,
												})
											}}
										>
											I AGREE
										</CustomButton>

										<div></div>
									</div>
								</Fade>
							</div>
						)}
						<Child></Child>
						{!config.prod && (
							<div
								style={{
									position: 'fixed',
									bottom: 0,
									right: 20,
									width: '100%',
									display: 'flex',
									alignItems: 'center',
									zIndex: 100,
									height: 25,
									justifyContent: 'center',
									maxWidth: 355,
									userSelect: 'none',
									paddingLeft: 10,
									opacity: 0.8,
								}}
							>
								<b
									style={{
										color: 'red',
										fontSize: 12,
										textShadow: '1px 1px 2px rgba(0,0,0,.5)',
									}}
								>
									{(!config.staging ? 'DEV' : 'STAG') +
										(config.cordovaBuild ? '_CORD' : '') +
										'-' +
										global.storage.getItem('build_number')}
								</b>

								{config.darkModeAvailable && (
									<b
										style={{
											fontSize: 13,
											marginLeft: 20,
											cursor: 'pointer',
											textShadow: '1px 1px 2px rgba(0,0,0,.5)',
											color: styles.colors.black,
										}}
										onClick={() => {
											global.toggleNightMode()
										}}
									>
										DARK
									</b>
								)}

								<b
									style={{
										fontSize: 13,
										marginLeft: 20,
										cursor: 'pointer',
										color: styles.colors.black,
										textShadow: '1px 1px 2px rgba(0,0,0,.5)',
									}}
									onClick={() => {
										global.changeLang()
										global.storage.setItem('lang', JSON.stringify(global.lang))
										window.location.reload()
									}}
								>
									LANG
								</b>

								<b
									onClick={() => {
										window.open(
											(config.cordovaBuild ? '#' : '') + '/components',
											'_blank'
										)
									}}
									style={{
										fontSize: 13,
										marginLeft: 20,
										color: styles.colors.black,
										cursor: 'pointer',
										textShadow: '1px 1px 2px rgba(0,0,0,.5)',
									}}
								>
									{'COMPONENTS'}
								</b>
							</div>
						)}
					</div>
				)}
			</MediaQuery>
		)
	}
}