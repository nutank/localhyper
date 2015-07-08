angular.module 'LocalHyper.auth'


.controller 'VerifyManualCtrl', ['$scope', 'CToast', 'App', 'SmsAPI', 'AuthAPI'
	, 'CSpinner', 'User', '$ionicPlatform'
	, ($scope, CToast, App, SmsAPI, AuthAPI, CSpinner, User, $ionicPlatform)->

		$scope.view = 
			display: 'noError'
			smsCode: ''
			errorAt: ''
			errorType: ''

			onError : (type, at)->
				@display = 'error'
				@errorType = type
				@errorAt = at

			requestSMSCode : ->
				CSpinner.show '', 'Please wait...'
				SmsAPI.requestSMSCode @user.phone
				.then (data)=>
					console.log data
					@display = 'maxAttempts' if data.attemptsExceeded
				, (error)=>
					@onError error, 'requestSMSCode'
				.finally ->
					CSpinner.hide()

			onNext : ->
				if @smsCode is '' or _.isUndefined(@smsCode)
					CToast.show 'Please enter 6 digit verification code'
				else
					@verifySmsCode()

			verifySmsCode : ->
				CSpinner.show '', 'Please wait...'
				SmsAPI.verifySMSCode @user.phone, @smsCode
				.then (data)=>
					if data.verified
						@register()
					else 
						CSpinner.hide()
						CToast.show 'Incorrect verification code'
				, (error)=>
					CSpinner.hide()
					@onError error, 'verifySmsCode'

			register : ->
				AuthAPI.register @user
				.then (success)->
					count = if App.isAndroid() then -3 else -2
					App.goBack count
				, (error)=>
					@onError error, 'register'
				.finally ->
					CSpinner.hide()

			onTapToRetry : ->
				@display = 'noError'
				switch @errorAt
					when 'requestSMSCode'
						@requestSMSCode()
					when 'verifySmsCode'
						@verifySmsCode()
					when 'register'
						@register()

		
		onDeviceBack = ->
			count = if App.isAndroid() then -2 else -1
			App.goBack count

		$scope.$on '$ionicView.beforeEnter', ->
			$scope.view.user = User.info 'get'

		$scope.$on '$ionicView.enter', ->
			#Device hardware back button for android
			$ionicPlatform.onHardwareBackButton onDeviceBack
			$scope.view.requestSMSCode() if App.isIOS()

		$scope.$on '$ionicView.leave', ->
			$ionicPlatform.offHardwareBackButton onDeviceBack
]