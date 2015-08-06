angular.module('LocalHyper.requestsOffers').controller('SuccessfulOffersCtrl', [
  '$scope', 'App', 'OffersAPI', '$ionicModal', '$timeout', '$rootScope', 'CDialog', '$ionicPlatform', function($scope, App, OffersAPI, $ionicModal, $timeout, $rootScope, CDialog, $ionicPlatform) {
    var onDeviceBack;
    $scope.view = {
      display: 'loader',
      errorType: '',
      requests: [],
      page: 0,
      canLoadMore: true,
      refresh: false,
      sortBy: 'updatedAt',
      descending: true,
      filter: {
        modal: null,
        excerpt: '',
        selected: [],
        originalAttrs: [],
        attributes: [
          {
            name: 'Pending delivery',
            value: 'pending_delivery',
            selected: false
          }, {
            name: 'Sent for delivery',
            value: 'sent_for_delivery',
            selected: false
          }, {
            name: 'Failed delivery',
            value: 'failed_delivery',
            selected: false
          }, {
            name: 'Successful delivery',
            value: 'successful',
            selected: false
          }
        ],
        loadModal: function() {
          return $ionicModal.fromTemplateUrl('views/requests-offers/successful-offer-filter.html', {
            scope: $scope,
            animation: 'slide-in-up',
            hardwareBackButtonClose: false
          }).then((function(_this) {
            return function(modal) {
              return _this.modal = modal;
            };
          })(this));
        },
        noChangeInSelection: function() {
          return _.isEqual(_.sortBy(this.originalAttrs), _.sortBy(this.attributes));
        },
        openModal: function() {
          this.originalAttrs = JSON.parse(JSON.stringify(this.attributes));
          return this.modal.show();
        },
        closeModal: function() {
          var msg;
          if (this.noChangeInSelection()) {
            return this.modal.hide();
          } else {
            msg = 'Your filter selection will go away';
            return CDialog.confirm('Exit Filter?', msg, ['Exit Anyway', 'Apply & Exit']).then((function(_this) {
              return function(btnIndex) {
                switch (btnIndex) {
                  case 1:
                    _this.attributes = _this.originalAttrs;
                    return _this.modal.hide();
                  case 2:
                    return _this.onApply();
                }
              };
            })(this));
          }
        },
        clearFilters: function() {
          this.selected = [];
          return _.each(this.attributes, function(attr) {
            return attr.selected = false;
          });
        },
        onApply: function() {
          if (this.noChangeInSelection()) {
            return this.modal.hide();
          } else {
            _.each(this.attributes, (function(_this) {
              return function(attr) {
                if (attr.selected) {
                  if (!_.contains(_this.selected, attr.value)) {
                    return _this.selected.push(attr.value);
                  }
                } else {
                  return _this.selected = _.without(_this.selected, attr.value);
                }
              };
            })(this));
            this.setExcerpt();
            this.modal.hide();
            return $scope.view.reFetch();
          }
        },
        setExcerpt: function() {
          var filterNames;
          filterNames = [];
          _.each(this.selected, (function(_this) {
            return function(val) {
              var attribute;
              attribute = _.filter(_this.attributes, function(attr) {
                return attr.value === val;
              });
              return filterNames.push(attribute[0].name);
            };
          })(this));
          return this.excerpt = filterNames.join(', ');
        }
      },
      offerDetails: {
        modal: null,
        showExpiry: false,
        data: {},
        pendingOfferId: "",
        loadModal: function() {
          return $ionicModal.fromTemplateUrl('views/requests-offers/successful-offer-details.html', {
            scope: $scope,
            animation: 'slide-in-up',
            hardwareBackButtonClose: true
          }).then((function(_this) {
            return function(modal) {
              return _this.modal = modal;
            };
          })(this));
        },
        show: function(request) {
          this.data = request;
          this.modal.show();
          return this.showExpiry = true;
        },
        onNotificationClick: function(offerId) {
          var index, requests;
          requests = $scope.view.requests;
          index = _.findIndex(requests, (function(_this) {
            return function(offer) {
              return offer.id === offerId;
            };
          })(this));
          if (index === -1) {
            this.pendingOfferId = offerId;
            return this.modal.show();
          } else {
            return this.show(requests[index]);
          }
        },
        handlePendingOffer: function() {
          var index, requests;
          if (this.pendingOfferId !== "") {
            requests = $scope.view.requests;
            index = _.findIndex(requests, (function(_this) {
              return function(offer) {
                return offer.id === _this.pendingOfferId;
              };
            })(this));
            this.data = requests[index];
            this.showExpiry = true;
            return this.pendingOfferId = "";
          }
        }
      },
      init: function() {
        this.offerDetails.loadModal();
        return this.filter.loadModal();
      },
      onScrollComplete: function() {
        return $scope.$broadcast('scroll.infiniteScrollComplete');
      },
      autoFetch: function() {
        this.page = 0;
        this.requests = [];
        return this.showOfferHistory();
      },
      reFetch: function(refresh) {
        if (refresh == null) {
          refresh = true;
        }
        this.refresh = refresh;
        this.page = 0;
        this.requests = [];
        this.canLoadMore = true;
        return $timeout((function(_this) {
          return function() {
            return _this.onScrollComplete();
          };
        })(this));
      },
      showOfferHistory: function() {
        var params;
        params = {
          page: this.page,
          acceptedOffers: true,
          displayLimit: 3,
          sortBy: this.sortBy,
          descending: this.descending,
          selectedFilters: this.filter.selected
        };
        return OffersAPI.getSellerOffers(params).then((function(_this) {
          return function(data) {
            console.log(data);
            return _this.onSuccess(data, params.displayLimit);
          };
        })(this), (function(_this) {
          return function(error) {
            return _this.onError(error);
          };
        })(this))["finally"]((function(_this) {
          return function() {
            App.resize();
            _this.page = _this.page + 1;
            return $scope.$broadcast('scroll.refreshComplete');
          };
        })(this));
      },
      onSuccess: function(offerData, displayLimit) {
        var offerDataSize;
        this.display = 'noError';
        offerDataSize = _.size(offerData);
        if (offerDataSize > 0) {
          if (offerDataSize < displayLimit) {
            this.canLoadMore = false;
          } else {
            this.canLoadMore = true;
            this.onScrollComplete();
          }
          if (this.refresh) {
            this.requests = offerData;
          } else {
            this.requests = this.requests.concat(offerData);
          }
        } else {
          this.canLoadMore = false;
        }
        return this.offerDetails.handlePendingOffer();
      },
      onError: function(type) {
        this.display = 'error';
        this.errorType = type;
        return this.canLoadMore = false;
      },
      onPullToRefresh: function() {
        this.refresh = true;
        this.page = 0;
        this.canLoadMore = true;
        return this.showOfferHistory();
      },
      onInfiniteScroll: function() {
        this.refresh = false;
        return this.showOfferHistory();
      },
      onTapToRetry: function() {
        this.display = 'loader';
        this.page = 0;
        return this.canLoadMore = true;
      }
    };
    onDeviceBack = function() {
      var filter;
      filter = $scope.view.filter;
      if ($('.loading-container').hasClass('visible')) {
        return $ionicLoading.hide();
      } else if (filter.modal.isShown()) {
        return filter.closeModal();
      } else {
        return App.goBack(-1);
      }
    };
    $scope.$on('$ionicView.enter', function() {
      return $ionicPlatform.onHardwareBackButton(onDeviceBack);
    });
    $scope.$on('$ionicView.leave', function() {
      return $ionicPlatform.offHardwareBackButton(onDeviceBack);
    });
    $scope.$on('modal.hidden', function() {
      $scope.view.offerDetails.pendingOfferId = "";
      return $timeout(function() {
        return $scope.view.offerDetails.showExpiry = false;
      }, 1000);
    });
    $rootScope.$on('in:app:notification', function(e, obj) {
      var payload;
      payload = obj.payload;
      if (payload.type === 'accepted_offer') {
        App.scrollTop();
        return $scope.view.autoFetch();
      }
    });
    return $scope.$on('$ionicView.enter', function() {
      var offerId;
      offerId = OffersAPI.acceptedOfferId('get');
      if (offerId !== '') {
        $scope.view.offerDetails.onNotificationClick(offerId);
      }
      return OffersAPI.acceptedOfferId('set', '');
    });
  }
]);
