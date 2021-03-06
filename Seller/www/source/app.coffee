#App - ShopOye Seller App

angular.module 'LocalHyper', ['ionic', 'ngCordova'
	, 'LocalHyper.common', 'LocalHyper.init', 'LocalHyper.storage'
	, 'LocalHyper.auth', 'LocalHyper.businessDetails', 'LocalHyper.main'
	, 'LocalHyper.categories', 'LocalHyper.brands', 'LocalHyper.googleMaps'
	, 'LocalHyper.requestsOffers', 'LocalHyper.requestsOffers', 'LocalHyper.profile'
	, 'LocalHyper.aboutUs', 'LocalHyper.suggestProduct', 'LocalHyper.creditHistory']


.run ['$rootScope', 'App', 'Push', '$timeout', 'User'
	, ($rootScope, App, Push, $timeout, User)->

		Parse.initialize APP_ID, JS_KEY
		$rootScope.App = App

		#User Notification Icon (Right popover)
		App.notification = 
			icon: false
			newRequests: 0
			accptedOffers: 0
			badge: false
			count: 0
			increment : ->
				@badge = true
				@count = @count + 1
			decrement : ->
				@count = @count - 1
				@badge = false if @count <= 0
					

		#Hide small app logo on categories view
		App.logo = small: true
		
		$rootScope.$on '$stateChangeSuccess', (ev, to, toParams, from, fromParams)->
			App.previousState = from.name
			App.currentState  = to.name
			
			switch App.currentState
				when 'business-details'
					business_details = if User.isLoggedIn() then '' else 'business-details'
				when 'brands'
					brands = if User.isLoggedIn() then '' else 'brands'
				when 'categories'
					categories = if User.isLoggedIn() then '' else 'categories'
				when 'sub-categories'
					sub_categories = if User.isLoggedIn() then '' else 'sub-categories'
				when 'choose-location'
					choose_location = if User.isLoggedIn() then '' else 'choose-location'

			#Enable/disable menu & show/hide notification icon
			hideForStates = ['tutorial', 'verify-begin', 'verify-auto', 'verify-manual'
							, 'category-chains', categories, sub_categories, business_details, brands, choose_location]
			
			bool = !_.contains(hideForStates, App.currentState)
			App.menuEnabled.left  = bool
			App.notification.icon = bool
]


.config ['$ionicConfigProvider', ($ionicConfigProvider)->

	$ionicConfigProvider.views.swipeBackEnabled false
	$ionicConfigProvider.views.forwardCache true
	$ionicConfigProvider.backButton.previousTitleText(false).text ''
	$ionicConfigProvider.navBar.alignTitle 'center'
	$ionicConfigProvider.tabs
		.style 'striped'
		.position 'top'
]

