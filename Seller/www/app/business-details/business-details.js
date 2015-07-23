angular.module('LocalHyper.businessDetails', ['ngAutocomplete']).controller('BusinessDetailsCtrl', [
  '$scope', 'CToast', 'App', 'GPS', 'GoogleMaps', 'CDialog', 'User', '$ionicModal', '$timeout', 'Storage', function($scope, CToast, App, GPS, GoogleMaps, CDialog, User, $ionicModal, $timeout, Storage) {
    $scope.view = {
      name: '',
      phone: '',
      businessName: '',
      confirmedAddress: '',
      terms: false,
      delivery: {
        radius: 10,
        plus: function() {
          if (this.radius < 100) {
            return this.radius++;
          }
        },
        minus: function() {
          if (this.radius > 1) {
            return this.radius--;
          }
        }
      },
      location: {
        modal: null,
        map: null,
        marker: null,
        latLng: null,
        address: null,
        addressFetch: true,
        showAlert: function() {
          var positiveBtn;
          positiveBtn = App.isAndroid() ? 'Open Settings' : 'Ok';
          return CDialog.confirm('Use location?', 'Please enable location settings', [positiveBtn, 'Cancel']).then(function(btnIndex) {
            if (btnIndex === 1) {
              return GPS.switchToLocationSettings();
            }
          });
        },
        onMapCreated: function(map) {
          this.map = map;
          return google.maps.event.addListener(this.map, 'click', (function(_this) {
            return function(event) {
              return _this.addMarker(event.latLng);
            };
          })(this));
        },
        setMapCenter: function(loc) {
          var latLng;
          latLng = new google.maps.LatLng(loc.lat, loc.long);
          this.map.setCenter(latLng);
          return latLng;
        },
        getCurrent: function() {
          return GPS.isLocationEnabled().then((function(_this) {
            return function(enabled) {
              if (!enabled) {
                return _this.showAlert();
              } else {
                CToast.show('Getting current location');
                return GPS.getCurrentLocation().then(function(loc) {
                  var latLng;
                  latLng = _this.setMapCenter(loc);
                  _this.map.setZoom(15);
                  return _this.addMarker(latLng);
                }, function(error) {
                  return CToast.show('Error locating your position');
                });
              }
            };
          })(this));
        },
        addMarker: function(latLng) {
          this.latLng = latLng;
          this.setAddress();
          if (this.marker) {
            this.marker.setMap(null);
          }
          this.marker = new google.maps.Marker({
            position: latLng,
            map: this.map,
            draggable: true
          });
          this.marker.setMap(this.map);
          return google.maps.event.addListener(this.marker, 'dragend', (function(_this) {
            return function(event) {
              _this.latLng = event.latLng;
              return _this.setAddress();
            };
          })(this));
        },
        setAddress: function() {
          this.addressFetch = false;
          return GoogleMaps.getAddress(this.latLng).then((function(_this) {
            return function(address) {
              return _this.address = address;
            };
          })(this), function(error) {
            return console.log('Geocode error: ' + error);
          })["finally"]((function(_this) {
            return function() {
              return _this.addressFetch = true;
            };
          })(this));
        }
      },
      init: function() {
        this.loadLocationModal();
        return this.initializeBusinessValue();
      },
      initializeBusinessValue: function() {
        return Storage.bussinessDetails('get', 'null').then((function(_this) {
          return function(value) {
            if (!_.isNull(value)) {
              _this.name = value.name;
              _this.phone = value.phone;
              _this.businessName = value.businessName;
              _this.confirmedAddress = value.confirmedAddress;
              _this.delivery.radius = value.deliveryRadius;
              _this.latitude = value.latitude;
              _this.longitude = value.longitude;
              _this.location.latLng = new google.maps.LatLng(value.latitude, value.longitude);
              return _this.location.address = value.address;
            }
          };
        })(this));
      },
      loadLocationModal: function() {
        return $ionicModal.fromTemplateUrl('views/business-details/location.html', {
          scope: $scope,
          animation: 'slide-in-up',
          hardwareBackButtonClose: true
        }).then((function(_this) {
          return function(modal) {
            return _this.location.modal = modal;
          };
        })(this));
      },
      onChangeLocation: function() {
        var mapHeight;
        this.location.modal.show();
        mapHeight = $('.map-content').height() - $('.address-inputs').height() - 10;
        $('.aj-big-map').css({
          'height': mapHeight
        });
        if (_.isNull(this.location.latLng)) {
          return $timeout((function(_this) {
            return function() {
              var loc;
              loc = {
                lat: GEO_DEFAULT.lat,
                long: GEO_DEFAULT.lng
              };
              _this.location.setMapCenter(loc);
              return _this.location.getCurrent();
            };
          })(this), 200);
        } else {
          return $timeout((function(_this) {
            return function() {
              var latLng, loc;
              loc = {
                lat: _this.latitude,
                long: _this.longitude
              };
              latLng = _this.location.setMapCenter(loc);
              _this.location.map.setZoom(15);
              return _this.location.addMarker(latLng);
            };
          })(this), 200);
        }
      },
      onConfirmLocation: function() {
        if (!_.isNull(this.location.latLng) && this.location.addressFetch) {
          return CDialog.confirm('Confirm Location', 'Do you want to confirm this location?', ['Confirm', 'Cancel']).then((function(_this) {
            return function(btnIndex) {
              if (btnIndex === 1) {
                _this.location.address.full = GoogleMaps.fullAddress(_this.location.address);
                _this.confirmedAddress = _this.location.address.full;
                return _this.location.modal.hide();
              }
            };
          })(this));
        } else {
          return CToast.show('Please wait, getting location details...');
        }
      },
      onNext: function() {
        if (_.contains([this.businessName, this.name, this.phone], '')) {
          return CToast.show('Fill up all fields');
        } else if (_.isUndefined(this.phone)) {
          return CToast.show('Please enter valid phone number');
        } else if (this.confirmedAddress === '') {
          return CToast.show('Please select your location');
        } else {
          this.latitude = this.location.latLng.lat();
          this.longitude = this.location.latLng.lng();
          User.info('set', $scope.view);
          return Storage.bussinessDetails('set', {
            name: this.name,
            phone: this.phone,
            businessName: this.businessName,
            address: this.location.address,
            confirmedAddress: this.confirmedAddress,
            latitude: this.latitude,
            longitude: this.longitude,
            deliveryRadius: this.delivery.radius
          }).then(function() {
            return App.navigate('category-chains');
          });
        }
      }
    };
    return $scope.$on('$ionicView.enter', function() {
      return App.hideSplashScreen();
    });
  }
]).config([
  '$stateProvider', function($stateProvider) {
    return $stateProvider.state('business-details', {
      url: '/business-details',
      parent: 'main',
      views: {
        "appContent": {
          controller: 'BusinessDetailsCtrl',
          templateUrl: 'views/business-details/business-details.html',
          resolve: {
            Maps: function($q, CSpinner, GoogleMaps) {
              var defer;
              defer = $q.defer();
              CSpinner.show('', 'Please wait...');
              GoogleMaps.loadScript().then(function() {
                return defer.resolve();
              })["finally"](function() {
                return CSpinner.hide();
              });
              return defer.promise;
            }
          }
        }
      }
    });
  }
]);
