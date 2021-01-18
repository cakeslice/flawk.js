/*
 * Copyright (c) 2020 José Guerreiro. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react'
import InputMask from 'react-input-mask'
import { css, style } from 'glamor'

var config = require('core/config_').default
var styles = require('core/styles').default

const MaskedInput = (props) => (
	<InputMask
		maskChar={' '}
		mask={props.mask}
		placeholder={props.placeholder}
		value={props.value}
		onChange={props.onChange}
		autoFocus={props.autoFocus}
		disabled={props.disabled}
	>
		{(inputProps) => (
			<input
				{...inputProps}
				{...css(props.style)}
				autoFocus={props.autoFocus}
				disabled={props.disabled}
				required={props.required}
			/>
		)}
	</InputMask>
)
const TextArea = (props) => <textarea {...props}></textarea>
const Input = (props) => <input {...props}></input>

export default class CustomInput extends Component {
	timer = null
	bufferedValue = null

	handleChangeBuffered = (e) => {
		clearTimeout(this.timer)

		this.bufferedValue = e.target.value

		this.timer = setTimeout(this.triggerChange, this.props.bufferInterval || 250)
	}
	handleKeyDown = (e) => {
		if (e.key === 'Enter') {
			clearTimeout(this.timer)
			this.triggerChange()
		}
	}
	triggerChange = () => {
		this.props.onChange && this.props.onChange({ target: { value: this.bufferedValue } })
		/* this.props.formIK &&
			this.props.formIK.setFieldValue &&
			this.props.formIK.setFieldValue(this.props.name, this.bufferedValue) */
	}

	render() {
		var value =
			this.props.formIK && this.props.formIK.values
				? this.props.formIK.values[this.props.name]
				: this.props.value
		var invalid =
			this.props.formIK && this.props.formIK.touched && this.props.formIK.errors
				? this.props.formIK.touched[this.props.name] &&
				  this.props.formIK.errors[this.props.name]
				: this.props.invalid

		//

		var mainStyle = {
			fontSize: styles.defaultFontSize,
			fontFamily: styles.font,
			textAlign: this.props.center ? 'center' : 'left',
			fontWeight: styles.inputFontWeight || undefined,

			borderRadius: styles.defaultBorderRadius,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxSizing: 'border-box',

			minHeight: styles.inputHeight,
			minWidth: 66,
			width: '100%',

			padding: this.props.textArea ? 10 : 0,
			margin: 0,
			paddingLeft: this.props.center ? 0 : 10,

			userSelect: 'none',
			whiteSpace: this.props.textArea ? '' : 'nowrap',
			textOverflow: this.props.textArea ? '' : 'ellipsis',

			color: styles.colors.black,

			borderColor: config.replaceAlpha(
				styles.colors.black,
				global.nightMode ? styles.inputBorderFactorNight : styles.inputBorderFactorDay
			),
			opacity: 1,
			'::placeholder': {
				fontWeight: 400,
				color: config.replaceAlpha(styles.colors.black, global.nightMode ? '0.25' : '.5'),
				opacity: 1,
			},
			...(!this.props.isDisabled && {
				':hover': {
					borderColor:
						!this.props.isDisabled && invalid
							? styles.colors.red
							: !this.props.isDisabled
							? config.replaceAlpha(
									styles.colors.black,
									global.nightMode ? '0.3' : '.3'
							  )
							: '',
				},
				':focus': {
					outline: 'none',
					boxShadow:
						'0 0 0 2px ' +
						(invalid
							? config.replaceAlpha(styles.colors.red, '.1')
							: styles.colors.mainVeryLight),
					/* background: invalid
						? 'rgba(254, 217, 219, 0.5)'
						: styles.colors.mainVeryLight, */
					borderColor: invalid ? styles.colors.red : styles.colors.mainLight,
				},
			}),
			background: 'transparent', // styles.colors.white,
			transition: 'background 200ms, border-color 200ms, box-shadow 200ms',
		}

		var InputComponent = MaskedInput
		var isMasked = true
		if (!this.props.mask) {
			isMasked = false
			InputComponent = Input
		}
		if (this.props.textArea) {
			isMasked = false
			InputComponent = TextArea
		}

		var finalStyle = {
			...mainStyle,
			...{
				justifyContent: 'center',
				alignItems: 'center',
				display: 'flex',
			},
			...this.props.style,
		}
		finalStyle = {
			...finalStyle,
			...(!this.props.isDisabled &&
				invalid && {
					boxShadow:
						invalid && '0 0 0 2px ' + config.replaceAlpha(styles.colors.red, '.1'),
					borderColor: config.replaceAlpha(
						styles.colors.red,
						global.nightMode
							? styles.inputBorderFactorNight
							: styles.inputBorderFactorDay
					),
					':focus': {
						...finalStyle[':focus'],
						borderColor: styles.colors.red,
					},
				}),
			...(this.props.isDisabled && {
				background: config.replaceAlpha(
					styles.colors.black,
					global.nightMode ? '0.05' : '.1'
				),
				color: config.replaceAlpha(styles.colors.black, global.nightMode ? '0.25' : '.5'),
				borderColor: config.replaceAlpha(
					styles.colors.black,
					global.nightMode ? '0.05' : '.1'
				),
				opacity: 0.75,
			}),
		}

		var actualInvalidType = this.props.invalidType
		var invalidType = this.props.invalidType
		if (invalid === '*' && this.props.label) invalidType = 'label'

		return (
			<div style={{ maxWidth: '100%', flex: this.props.flex }}>
				{this.props.label && (
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							opacity: global.nightMode
								? styles.inputLabelOpacityNight
								: styles.inputLabelOpacityDay,
							letterSpacing: 0.4,
							textAlign: this.props.label.length === 1 && 'end',
							fontSize: styles.defaultFontSize,
							...this.props.labelStyle,
						}}
					>
						{this.props.label}
						{invalidType === 'label' &&
							this.props.name &&
							!this.props.isDisabled &&
							invalid &&
							invalid.length > 0 && (
								<span
									style={{
										marginLeft: 7.5,
										fontSize: styles.defaultFontSize,
										color: styles.colors.red,
									}}
								>
									{invalid}
								</span>
							)}
					</div>
				)}
				{this.props.label && <div style={{ minHeight: 5 }}></div>}
				<div style={{ display: 'flex' }}>
					<InputComponent
						defaultValue={this.props.defaultValue}
						autoFocus={this.props.autoFocus}
						required={this.props.required}
						value={value}
						name={this.props.name}
						autoComplete={this.props.autoComplete}
						type={this.props.type ? this.props.type : 'text'}
						disabled={this.props.isDisabled}
						mask={this.props.mask}
						placeholder={this.props.placeholder ? this.props.placeholder : ''}
						onFocus={(e) => {
							e.target.placeholder = ''
							this.props.onFocus && this.props.onFocus(e)
						}}
						onKeyPress={
							this.props.bufferedInput ? this.handleKeyDown : this.props.onKeyPress
						}
						onChange={(e, editor, next) => {
							if (this.props.bufferedInput) {
								this.handleChangeBuffered(e)
							} else {
								this.props.onChange && this.props.onChange(e)

								this.props.formIK &&
									this.props.formIK.handleChange &&
									this.props.formIK.handleChange(e)
							}
						}}
						onBlur={(e, editor, next) => {
							e.target.placeholder = this.props.placeholder
								? this.props.placeholder
								: ''
							this.props.onBlur && this.props.onBlur(e)

							this.props.formIK &&
								this.props.formIK.handleBlur &&
								this.props.formIK.handleBlur(e)
						}}
						style={isMasked ? finalStyle : {}}
						{...(!isMasked && css(finalStyle))}
					></InputComponent>
					{this.props.icon && (
						<div style={{ maxWidth: 0, maxHeight: 0 }}>
							<div
								style={{
									userSelect: 'none',
									pointerEvents: 'none',
									position: 'relative',
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									width: 30,
									right: 35,
									height: styles.inputHeight,
								}}
							>
								{this.props.icon}
							</div>
						</div>
					)}
					{invalidType === 'right' && this.props.name && (
						<div style={{ minWidth: 16, display: 'flex' }}>
							{!this.props.isDisabled && invalid && invalid.length > 0 && (
								<div style={{ minWidth: 5 }}></div>
							)}
							{!this.props.isDisabled && invalid && invalid.length > 0 && (
								<p
									style={{
										fontSize: styles.defaultFontSize,
										color: styles.colors.red,
									}}
								>
									{invalid}
								</p>
							)}
						</div>
					)}
				</div>
				{!actualInvalidType && this.props.name && (
					<div style={{ minHeight: 26 }}>
						{!invalidType &&
							!this.props.isDisabled &&
							invalid &&
							invalid.length > 0 && <div style={{ minHeight: 5 }}></div>}
						{!invalidType && !this.props.isDisabled && invalid && invalid.length > 0 && (
							<p
								style={{
									fontSize: styles.defaultFontSize,
									color: styles.colors.red,
								}}
							>
								{invalid}
							</p>
						)}
					</div>
				)}
			</div>
		)
	}
}
