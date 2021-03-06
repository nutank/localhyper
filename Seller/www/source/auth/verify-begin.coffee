angular.module 'LocalHyper.auth'


.controller 'VerifyBeginCtrl', ['$scope', 'App', 'CToast', 'User', 'UIMsg', 'Storage'
	, ($scope, App, CToast, User, UIMsg, Storage)->

		$scope.user = 
			name: ''
			phone: ''

			setDetails : ->
				userInfo = User.info 'get'
				@name = userInfo.name
				@phone = userInfo.phone

			onProceed : ->
				if _.contains [@name, @phone], ''
					CToast.show 'Fill up all fields'
				else if _.isUndefined @phone
					CToast.show 'Enter valid phone number'
				else
					@nextStep()

			nextStep : ->
				if App.isOnline()
					Storage.bussinessDetails 'get'
					.then (details)=>
						details['phone'] = @phone
						details['name']  = @name
						Storage.bussinessDetails 'set', details
						.then ->
							User.info 'set', $scope.user
							state = if App.isAndroid() then 'verify-auto' else 'verify-manual'
							App.navigate state
				else
					CToast.show UIMsg.noInternet


		$scope.$on '$ionicView.beforeEnter', ->
			$scope.user.setDetails()
]