angular.module 'LocalHyper.requestsOffers', []


.config ['$stateProvider', ($stateProvider)->

	$stateProvider

		.state 'tabs',
			url: "/tab"
			abstract: true
			parent: 'main'
			views: 
				"appContent":
					templateUrl: 'views/requests-offers/tabs.html'

		.state 'new-requests',
			url: '/new-requests'
			parent: 'tabs'
			views: 
				"newRequestsTab":
					controller: 'NewRequestCtrl'
					templateUrl: 'views/requests-offers/new-requests.html'

		.state 'my-offer-history',
			url: '/my-offer-history'
			parent: 'tabs'
			views: 
				"myOfferHistoryTab":
					controller: 'MyOfferHistoryCtrl'
					templateUrl: 'views/requests-offers/my-offer-history.html'

		.state 'successful-offers',
			url: '/successful-offers'
			parent: 'tabs'
			views: 
				"successfulOffersTab":
					controller: 'SuccessfulOffersCtrl'
					templateUrl: 'views/requests-offers/successful-offers.html'
]