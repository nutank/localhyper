#App - ShopOye Seller App

angular.module 'LocalHyper', ['ionic', 'ngCordova'
	, 'LocalHyper.common', 'LocalHyper.init', 'LocalHyper.storage'
	, 'LocalHyper.auth', 'LocalHyper.businessDetails', 'LocalHyper.main'
	, 'LocalHyper.categories', 'LocalHyper.brands', 'LocalHyper.googleMaps'
	, 'LocalHyper.requestsOffers']


.run ['$rootScope', 'App', 'Push', '$timeout', 'GoogleMaps'
	, ($rootScope, App, Push, $timeout, GoogleMaps)->

		Parse.initialize APP_ID, JS_KEY
		$rootScope.App = App
		GoogleMaps.loadScript()

		#User Notification Icon (Right popover)
		App.notification = 
			icon: false
			badge: false
			count: 0
			increment : ->
				@badge = true
				@count = @count + 1
			decrement : ->
				@count = @count - 1
				if @count is 0
					@badge = false

		#Hide small app logo on categories view
		App.logo = small: true
		
		$rootScope.$on '$stateChangeSuccess', (ev, to, toParams, from, fromParams)->
			App.previousState = from.name
			App.currentState  = to.name

			#Enable/disable menu & show/hide notification icon
			hideForStates = ['tutorial', 'business-details', 'verify-begin', 'verify-auto'
							, 'verify-manual', 'categories', 'sub-categories', 'brands']
			bool = !_.contains(hideForStates, App.currentState)
			App.menuEnabled.left  = bool
			App.notification.icon = bool

			App.logo.small = App.currentState isnt 'requests'
]


.config ['$ionicConfigProvider', ($ionicConfigProvider)->

	$ionicConfigProvider.views.forwardCache true
	$ionicConfigProvider.backButton.previousTitleText(false).text ''
	$ionicConfigProvider.navBar.alignTitle 'center'
	$ionicConfigProvider.tabs.position 'top'
]
