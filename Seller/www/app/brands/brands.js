angular.module('LocalHyper.brands', []).controller('BrandsCtrl', [
  '$scope', 'BrandsAPI', '$stateParams', 'SubCategory', 'CToast', 'CategoriesAPI', 'App', 'CDialog', function($scope, BrandsAPI, $stateParams, SubCategory, CToast, CategoriesAPI, App, CDialog) {
    $scope.view = {
      title: SubCategory.name,
      brands: [],
      display: 'loader',
      errorType: '',
      categoryChains: null,
      init: function() {
        return this.getBrands();
      },
      getBrands: function() {
        return BrandsAPI.getAll($stateParams.categoryID).then((function(_this) {
          return function(data) {
            console.log(data);
            return _this.onSuccess(data.supported_brands);
          };
        })(this), (function(_this) {
          return function(error) {
            return _this.onError(error);
          };
        })(this));
      },
      onSuccess: function(data) {
        this.display = 'noError';
        return this.brands = data;
      },
      onError: function(type) {
        this.display = 'error';
        return this.errorType = type;
      },
      onTapToRetry: function() {
        this.display = 'loader';
        return this.getBrands();
      },
      isCategoryChainsEmpty: function() {
        var empty;
        this.categoryChains = CategoriesAPI.categoryChains('get');
        empty = _.isEmpty(this.categoryChains);
        return empty;
      },
      brandSelection: function(brandID) {
        var _brandIds, _brands, chain, selected;
        selected = false;
        if (this.isCategoryChainsEmpty()) {
          selected = false;
        } else {
          chain = _.filter(this.categoryChains, function(chains) {
            return chains.subCategory.id === SubCategory.id;
          });
          if (!_.isEmpty(chain)) {
            _brands = chain[0].brands;
            _brandIds = _.pluck(_brands, 'objectId');
            selected = _.contains(_brandIds, brandID);
          } else {
            selected = false;
          }
        }
        return selected;
      },
      setBrandSelection: function() {
        var _brandIds, _brands, chain;
        if (this.isCategoryChainsEmpty()) {
          return _.each(this.brands, function(brand) {
            return brand.selected = false;
          });
        } else {
          chain = _.filter(this.categoryChains, function(chains) {
            return chains.subCategory.id === SubCategory.id;
          });
          if (!_.isEmpty(chain)) {
            _brands = chain[0].brands;
            _brandIds = _.pluck(_brands, 'objectId');
            return _.each(this.brands, function(brand) {
              return brand.selected = _.contains(_brandIds, brand.objectId);
            });
          }
        }
      },
      setCategoryChains: function() {
        var empty;
        empty = this.isCategoryChainsEmpty();
        return CategoriesAPI.getAll().then((function(_this) {
          return function(allCategories) {
            var chain, chainIndex, data, existingChain, parentCategory, selectedBrands;
            parentCategory = _.filter(allCategories, function(category) {
              return category.id === SubCategory.parent;
            });
            selectedBrands = _.filter(_this.brands, function(brand) {
              return brand.selected === true;
            });
            data = [];
            chain = {
              category: parentCategory[0],
              subCategory: SubCategory,
              brands: selectedBrands
            };
            data.push(chain);
            if (empty) {
              return CategoriesAPI.categoryChains('set', data);
            } else {
              existingChain = false;
              chainIndex = _.findIndex(_this.categoryChains, function(chains) {
                return chains.subCategory.id === SubCategory.id;
              });
              if (chainIndex !== -1) {
                if (_.size(selectedBrands) > 0) {
                  _this.categoryChains[chainIndex].brands = selectedBrands;
                } else {
                  _this.categoryChains.splice(chainIndex, 1);
                }
              }
              if (chainIndex === -1 && _.size(chain.brands) > 0) {
                _this.categoryChains.push(chain);
              }
              return CategoriesAPI.categoryChains('set', _this.categoryChains);
            }
          };
        })(this));
      },
      onDone: function() {
        var count, empty, minOneBrandSelected;
        this.setCategoryChains();
        minOneBrandSelected = !_.isUndefined(_.find(this.brands, function(brand) {
          return brand.selected === true;
        }));
        empty = this.isCategoryChainsEmpty();
        if (empty && !minOneBrandSelected) {
          return CToast.show('Please select atleast one brand');
        } else if (!empty && !minOneBrandSelected) {
          return CDialog.confirm('Select Brands', 'You have not selected any brands', ['Continue', 'Cancel']).then((function(_this) {
            return function(btnIndex) {
              if (btnIndex === 1) {
                return App.navigate('category-chains');
              }
            };
          })(this));
        } else {
          count = App.previousState === 'categories' ? -2 : -3;
          return App.goBack(count);
        }
      }
    };
    return $scope.$on('$ionicView.beforeEnter', function() {
      if ($scope.view.display === 'noError') {
        return $scope.view.setBrandSelection();
      }
    });
  }
]).config([
  '$stateProvider', function($stateProvider) {
    return $stateProvider.state('brands', {
      url: '/brands:categoryID',
      parent: 'main',
      views: {
        "appContent": {
          templateUrl: 'views/brands/brands.html',
          controller: 'BrandsCtrl',
          resolve: {
            SubCategory: function($stateParams, CategoriesAPI) {
              var childCategory, subCategories;
              subCategories = CategoriesAPI.subCategories('get');
              childCategory = _.filter(subCategories, function(category) {
                return category.id === $stateParams.categoryID;
              });
              return childCategory[0];
            }
          }
        }
      }
    });
  }
]);
