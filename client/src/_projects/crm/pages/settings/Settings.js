/*
 * Copyright (c) 2020 José Guerreiro. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { fetchUser } from '../../redux/UserState'
import MediaQuery from 'react-responsive'
import { Formik, Form } from 'formik'
import _ from 'lodash'
import CustomButton from 'core/components/CustomButton'
import CustomInput from 'core/components/CustomInput'
import { get, post } from 'core/api'
import Avatar from 'core/components/Avatar'
var validator = require('validator')

var styles = require('core/styles').default
var config = require('core/config_').default

class Settings extends Component {
	state = {}

	render() {
		if (!this.props.user) return <div></div>

		return (
			<MediaQuery minWidth={config.mobileWidthTrigger}>
				{(desktop) => (
					<div>
						<div
							style={{
								...styles.card,
								alignSelf: desktop && 'center',
								width: desktop && 'fit-content',
							}}
						>
							<Formik
								validate={(values) => {
									let errors = {}

									if (!values.email) {
										errors.email = '*'
									} else if (!validator.isEmail(values.email)) {
										errors.email = 'Invalid e-mail'
									}

									if (!values.firstName) {
										errors.firstName = '*'
									}
									if (!values.lastName) errors.lastName = '*'

									if (values.password && values.password.length < 6) {
										errors.password = 'Minimum 6 characters'
									}

									return errors
								}}
								initialValues={{
									firstName: this.props.user.personal.firstName,
									lastName: this.props.user.personal.lastName,
									email: this.props.user.email,
									photoURL: this.props.user.personal.photoURL,
									photoFile: undefined,
									password: undefined,
								}}
								onSubmit={async (values, { setSubmitting }) => {
									setSubmitting(true)

									if (values.photoFile) {
										config.uploadFile(
											values.photoFile,
											async (success, imageURL) => {
												if (success) {
													var res = await post('client/change_settings', {
														...values,
														photoURL: imageURL,
														photoFile: undefined,
													})

													if (res.ok) {
														global.analytics.event({
															category: 'Editing',
															action: 'Changed settings',
														})

														if (res.body.token)
															global.storage.setItem(
																'token',
																res.body.token
															)
														if (this.props.fetchUser)
															this.props.fetchUser()
													}
												}

												setSubmitting(false)
											},
											this,
											post
										)
									} else {
										var res = await post('client/change_settings', {
											...values,
											photoURL: undefined,
											photoFile: undefined,
										})

										if (res.ok) {
											if (res.body.token)
												global.storage.setItem('token', res.body.token)
											if (this.props.fetchUser) this.props.fetchUser()
										}

										setSubmitting(false)
									}
								}}
							>
								{({
									values,
									handleChange,
									handleBlur,
									errors,
									touched,
									isSubmitting,
									setFieldValue,
									setFieldTouched,
								}) => (
									<Form noValidate>
										<div
											className='wrapMargin'
											style={{
												display: 'flex',
												justifyContent: 'space-around',
												flexWrap: 'wrap',
											}}
										>
											<CustomInput
												label={'First name'}
												name='firstName'
												value={values.firstName}
												invalidType={'label'}
												invalid={touched.firstName && errors.firstName}
												placeholder={''}
												onChange={handleChange}
												onBlur={handleBlur}
											/>
											<CustomInput
												label={'Last name'}
												name='lastName'
												value={values.lastName}
												invalidType={'label'}
												invalid={touched.lastName && errors.lastName}
												placeholder={''}
												onChange={handleChange}
												onBlur={handleBlur}
											/>
										</div>
										<div
											className='wrapMargin'
											style={{
												display: 'flex',
												justifyContent: 'space-around',
												flexWrap: 'wrap',
											}}
										>
											<CustomInput
												label={'E-mail'}
												type={'email'}
												name='email'
												autoComplete='new-email'
												value={values.email}
												invalidType={'label'}
												invalid={touched.email && errors.email}
												placeholder={''}
												onChange={handleChange}
												onBlur={handleBlur}
											/>
											<div>
												<CustomInput
													label={'Password'}
													name='password'
													autoComplete='new-password'
													type={'password'}
													value={values.password}
													//invalidType={'label'}
													invalid={touched.password && errors.password}
													placeholder={'********'}
													onChange={handleChange}
													onBlur={handleBlur}
												/>
											</div>
										</div>
										<sp />
										<div style={{ display: 'flex', alignItems: 'center' }}>
											<label
												htmlFor={
													desktop ? 'file_upload' : 'file_upload_mobile'
												}
												style={{
													alignSelf: 'center',
													display: 'flex',
													cursor: 'pointer',
												}}
											>
												{!this.state.uploading && (
													<input
														disabled={isSubmitting}
														style={{ fontSize: 10, width: 150 }}
														required
														type='file'
														id={
															desktop
																? 'file_upload'
																: 'file_upload_mobile'
														}
														accept='image/*'
														onChange={async (e) => {
															var img = await config.handleImageChange(
																e
															)
															if (img) {
																setFieldValue('photoURL', img.url)
																setFieldValue('photoFile', img.file)
															}
														}}
													/>
												)}
												<Avatar src={values.photoURL}></Avatar>
											</label>
											<div style={{ marginLeft: 10 }}>
												{config.text(
													'settings.drawer.account.profileImage'
												)}
											</div>
										</div>
										<sp />
										<div
											style={{
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
											}}
										>
											<CustomButton
												type='submit'
												isDisabled={
													!_.isEmpty(touched) && !_.isEmpty(errors)
												}
												isLoading={isSubmitting || this.props.fetchingUser}
												appearance='primary'
											>
												{'Save'}
											</CustomButton>
										</div>
									</Form>
								)}
							</Formik>
						</div>
					</div>
				)}
			</MediaQuery>
		)
	}
}
export default connect(
	(state) => ({
		user: state.redux.user,
		fetchingUser: state.redux.fetchingUser,
	}),
	{
		fetchUser,
	}
)(Settings)