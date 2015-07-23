angular.module 'LocalHyper.storage', []


.factory 'Storage', [->

	Storage = {}

	Storage.slideTutorial = (action)->
		switch action
			when 'set'
				localforage.setItem 'app_tutorial_seen', true
			when 'get'
				localforage.getItem 'app_tutorial_seen'

	Storage.bussinessDetails = (action, params)->
		switch action
			when 'set'
				localforage.setItem 'business_details', params
			when 'get'
				localforage.getItem 'business_details'

	Storage
]