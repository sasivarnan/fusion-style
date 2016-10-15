angular.module('angularApp', ['ngRoute', 'ui.bootstrap', 'cgBusy', 'rzModule'])
  .value('cgBusyDefaults', {
    message: 'Searching',
    templateUrl: 'templates/custom-loading.html',
    delay: 0,
    minDuration: 700
  })
  .filter('productsFilter', function () {
    return function (products, searchText, priceMin, priceMax) {
      
      var filteredItems = products.filter(function (product) {
        return product.price >= priceMin && product.price <= priceMax;
      });
      var categories = ['Apparel', 'Accessories'], selectedCategory = categories.indexOf(searchText);
      if (selectedCategory != -1) {
        filteredItems = filteredItems.filter(function (product) {
          return product.category == selectedCategory;
        });
      } else if (searchText) {
        filteredItems = filteredItems.filter(function (product) {
          return product.name.toLowerCase().indexOf(searchText) != -1;
        });
      } else {
        filteredItems = filteredItems;
      }
      return filteredItems;

    }
  })
  .controller('HeaderController', function ($scope, $location) {
    $scope.isActive = function (currentLocation) {
      return currentLocation === $location.path();
    };
  })
  .controller('ProductsController', function ($scope, $http, $uibModal) {

    var fetchedProducts;

    $scope.products = [];
    $scope.appliedFilter = null;

    //available categories
    $scope.categories = ['Apparel', 'Accessories'];

    $scope.priceRange = {
      min: 0,
      max: 180,
      options: {
        floor: 0,
        ceil: 450,
        translate: function (value) {
          return '₹' + value;
        }
      }
    };

    $scope.fetchingProducts = $http({
      method: 'GET',
      url: 'https://hackerearth.0x10.info/api/fashion?type=json&query=list_products'
      // url: '/data/products.json'
    }).then(function successCallback(response) {
      var products = response.data.products;

      products.forEach(function (product) {
        product.isWishListed = Boolean(localStorage.getItem(product.id));
      });

      fetchedProducts = products.concat();
      $scope.products = products;

      //find the maximum price and set to 
      var priceArray = products.map(function (product) {
        return product.price;
      });
      var maxPrice = Math.max.apply(null, priceArray);
      $scope.priceRange.max = maxPrice;
      $scope.priceRange.options.ceil = maxPrice;

      $scope.APIHits = response.data.quote_available;

      // console.log(response);
    }, function errorCallback(response) {
      console.log(response);
    });

    //open image in a modal dialog
    $scope.openImageModal = function (product) {
      $uibModal.open({
        templateUrl: 'productImage.html',
        controller: function ($scope) {
          $scope.selectedProduct = product;
        }
      });
    };

    //clear selected Tag
    $scope.clearSearchText = function () {
      $scope.selectedTag = null;
    };

    //sort products based on a property
    $scope.sortProducts = function (property, direction) {
      $scope.appliedFilter = { property: property, direction: direction ? 'Low To High' : 'High To Low' };
      $scope.products.sort(function (productA, productB) {
        return (productA[property] - productB[property]) * direction;
      });
    }

    //clear applied sorting
    $scope.clearSort = function () {
      $scope.products = fetchedProducts;
      $scope.appliedFilter = null;
    }

    //Add or remove product from wishlist (stored in localStorage)
    $scope.toggleWishList = function (event, product) {
      event.stopPropagation();
      product.isWishListed ? localStorage.removeItem(product.id) : localStorage.setItem(product.id, true);
      product.isWishListed = !product.isWishListed;
    }

  })
  .config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
    $locationProvider.hashPrefix('!');

    $routeProvider
      .when('/', {
        templateUrl: 'views/home.html',
        controller: 'ProductsController'
      })
      .otherwise({ redirectTo: '/' });

  }]);
