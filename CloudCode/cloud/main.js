(function() {
  var _, getAreaBoundSellers, getCategoryBasedSellers, getNotificationData, processPushNotifications, treeify;

  Parse.Cloud.define('getAttribValueMapping', function(request, response) {
    var AttributeValues, Attributes, Category, categoryId, categoryQuery, filterableAttributes, findCategoryPromise, secondaryAttributes;
    categoryId = request.params.categoryId;
    filterableAttributes = request.params.filterableAttributes;
    secondaryAttributes = request.params.secondaryAttributes;
    Category = Parse.Object.extend('Category');
    Attributes = Parse.Object.extend('Attributes');
    AttributeValues = Parse.Object.extend('AttributeValues');
    categoryQuery = new Parse.Query("Category");
    categoryQuery.equalTo("objectId", categoryId);
    if (filterableAttributes) {
      categoryQuery.include("filterable_attributes");
    }
    if (secondaryAttributes) {
      categoryQuery.include("secondary_attributes");
    }
    findCategoryPromise = categoryQuery.first();
    return findCategoryPromise.done((function(_this) {
      return function(categoryData) {
        var filterable_attributes, findQs;
        filterable_attributes = [];
        if (filterableAttributes) {
          filterable_attributes = categoryData.get('filterable_attributes');
        }
        if (secondaryAttributes) {
          filterable_attributes = _.union(filterable_attributes, categoryData.get('secondary_attributes'));
        }
        findQs = [];
        findQs = _.map(filterable_attributes, function(attribute) {
          var attributeId, attributeValues, innerQuery, query;
          attributeId = attribute.id;
          attributeValues = [];
          innerQuery = new Parse.Query("Attributes");
          innerQuery.equalTo("objectId", attributeId);
          query = new Parse.Query("AttributeValues");
          query.matchesQuery("attribute", innerQuery);
          query.include("attribute");
          return query.find();
        });
        return Parse.Promise.when(findQs).then(function() {
          var finalArr, individualFindResults;
          individualFindResults = _.flatten(_.toArray(arguments));
          finalArr = [];
          _.each(individualFindResults, function(individualResult) {
            var object;
            object = {
              "attributeId": individualResult.get("attribute").id,
              "attributeName": individualResult.get("attribute").get("name"),
              "group": individualResult.get("attribute").get("group"),
              "displayType": individualResult.get("attribute").get("displayType"),
              "valueId": individualResult.id,
              "value": individualResult.get("value")
            };
            return finalArr.push(object);
          });
          Parse.Promise.as();
          return response.success(finalArr);
        }, function(error) {
          return response.error(error);
        });
      };
    })(this));
  });

  Parse.Cloud.define('attributeImport', function(request, response) {
    var Attributes, attributeSavedArr, attributes, categoryId, isFilterable;
    Attributes = Parse.Object.extend('Attributes');
    attributeSavedArr = [];
    attributes = request.params.attributes;
    categoryId = request.params.categoryId;
    isFilterable = request.params.isFilterable;
    _.each(attributes, function(attributeObj) {
      var attribute;
      attribute = new Attributes();
      if (attributeObj.objectId !== "") {
        attribute.id = attributeObj.objectId;
      }
      attribute.set("name", attributeObj.name);
      attribute.set("group", attributeObj.group);
      if (attributeObj.unit !== "") {
        attribute.set("unit", attributeObj.unit);
      }
      if (attributeObj.hasOwnProperty("display_type")) {
        attribute.set("display_type", attributeObj.display_type);
      } else {
        attribute.set("display_type", "checkbox");
      }
      if (attributeObj.hasOwnProperty("type")) {
        attribute.set("type", attributeObj.type);
      } else {
        attribute.set("type", "select");
      }
      return attributeSavedArr.push(attribute);
    });
    return Parse.Object.saveAll(attributeSavedArr, {
      success: function(objs) {
        var Category, category;
        Category = Parse.Object.extend('Category');
        category = new Category();
        category.id = categoryId;
        if (isFilterable === true) {
          category.set("filterable_attributes", objs);
        } else {
          category.set("secondary_attributes", objs);
        }
        return category.save().then(function(categoryObj) {
          var successObj;
          successObj = {
            success: true,
            message: "Successfully added/updated the attributes"
          };
          return response.success(successObj);
        }, function(error) {
          return response.error(error);
        });
      },
      error: function(error) {
        return response.error("Failed to add/update attributes due to - " + error.message);
      }
    });
  });

  Parse.Cloud.define('attributeValueImport', function(request, response) {
    var AttributeValues, attributeValSavedArr, attributeValues, categoryId;
    AttributeValues = Parse.Object.extend('AttributeValues');
    attributeValSavedArr = [];
    attributeValues = request.params.attributeValues;
    categoryId = request.params.categoryId;
    _.each(attributeValues, function(attributeValObj) {
      var attributePointer, attributeValue, value;
      attributeValue = new AttributeValues();
      if (attributeValObj.objectId !== "") {
        attributeValue.id = attributeValObj.objectId;
      }
      value = String(attributeValObj.value);
      attributeValue.set("value", value);
      attributePointer = {
        "__type": "Pointer",
        "className": "Attributes",
        "objectId": attributeValObj.attributeId
      };
      attributeValue.set("attribute", attributePointer);
      return attributeValSavedArr.push(attributeValue);
    });
    return Parse.Object.saveAll(attributeValSavedArr, {
      success: function(objs) {
        var successObj;
        successObj = {
          success: true,
          message: "Successfully added/updated the attribute values"
        };
        return response.success(successObj);
      },
      error: function(error) {
        return response.error("Failed to add/update attributes due to - " + error.message);
      }
    });
  });

  Parse.Cloud.define('getCategoryBasedBrands', function(request, response) {
    var categoryId, queryCategory;
    categoryId = request.params.categoryId;
    queryCategory = new Parse.Query("Category");
    queryCategory.equalTo("objectId", categoryId);
    queryCategory.include("supported_brands");
    queryCategory.select("supported_brands");
    return queryCategory.first().then(function(category) {
      return response.success(category);
    }, function(error) {
      return response.error("Error - " + error.message);
    });
  });

  Parse.Cloud.define('brandImport', function(request, response) {
    var Brand, brands, brandsSavedArr, categoryId;
    Brand = Parse.Object.extend('Brand');
    brandsSavedArr = [];
    brands = request.params.brands;
    categoryId = request.params.categoryId;
    _.each(brands, function(brandObj) {
      var brand, image;
      brand = new Brand();
      if (brandObj.objectId !== "") {
        brand.id = brandObj.objectId;
      }
      brand.set("name", brandObj.name);
      image = {
        "src": brandObj.imageUrl
      };
      brand.set("image", image);
      return brandsSavedArr.push(brand);
    });
    return Parse.Object.saveAll(brandsSavedArr, {
      success: function(objs) {
        var Category, category;
        Category = Parse.Object.extend('Category');
        category = new Category();
        category.id = categoryId;
        category.set("supported_brands", objs);
        return category.save().then(function(categoryObj) {
          var successObj;
          successObj = {
            success: true,
            message: "Successfully added/updated the brands"
          };
          return response.success(successObj);
        }, function(error) {
          return response.error(error);
        });
      },
      error: function(error) {
        return response.error(error);
      }
    });
  });

  _ = require('underscore.js');

  treeify = function(list, idAttr, parentAttr, childrenAttr) {
    var lookup, treeList;
    if (!idAttr) {
      idAttr = 'id';
    }
    if (!parentAttr) {
      parentAttr = 'parent';
    }
    if (!childrenAttr) {
      childrenAttr = 'children';
    }
    treeList = [];
    lookup = {};
    list.forEach(function(obj) {
      lookup[obj[idAttr]] = obj;
      obj[childrenAttr] = [];
    });
    list.forEach(function(obj) {
      var parentId;
      if (obj[parentAttr] !== null) {
        parentId = obj[parentAttr];
        lookup[parentId][childrenAttr].push(obj);
      } else {
        treeList.push(obj);
      }
    });
    return treeList;
  };

  Parse.Cloud.define('getCategories', function(request, response) {
    var Category, queryCategory, queryFindPromise, sortBy;
    sortBy = request.params.sortBy;
    Category = Parse.Object.extend('Category');
    queryCategory = new Parse.Query(Category);
    queryCategory.include("parent_category");
    queryFindPromise = queryCategory.find();
    queryFindPromise.done((function(_this) {
      return function(results) {
        var categoryHierarchyTree, list, responseData;
        list = [];
        _.each(results, function(resultobj) {
          var listObj, parentCat;
          listObj = {
            id: resultobj.id,
            name: resultobj.get('name'),
            sort_order: resultobj.get('sort_order'),
            image: resultobj.get('image')
          };
          if (_.isObject(resultobj.get('parent_category'))) {
            parentCat = resultobj.get('parent_category');
            listObj['parent'] = parentCat.id;
          } else {
            listObj['parent'] = null;
          }
          return list.push(listObj);
        });
        categoryHierarchyTree = treeify(list, 'id', 'parent', 'children');
        responseData = {
          "success": true,
          "data": _.sortBy(categoryHierarchyTree, sortBy)
        };
        return response.success(responseData);
      };
    })(this));
    return queryFindPromise.fail((function(_this) {
      return function(error) {
        var responseData;
        responseData = {
          "success": false,
          "errorCode": error.code,
          "msg": error.msg
        };
        return response.error(responseData);
      };
    })(this));
  });

  Parse.Cloud.define("sendMail", function(request, status) {
    var Mandrill, brand, category, comments, description, productName, text;
    productName = request.params.productName;
    category = request.params.category;
    brand = request.params.brand;
    description = request.params.description;
    comments = request.params.comments;
    text = '<p>Product Name:' + productName + '<br> Category:' + category + '<br> Brand: ' + brand + '<br> Categories: ' + description + '<br> Comments:' + comments + '<p>';
    Mandrill = require('mandrill');
    Mandrill.initialize('JGQ1FMECVDSJLnOFvxDzaQ');
    return Mandrill.sendEmail({
      message: {
        html: "<p>" + text + "</p>",
        text: text,
        subject: "Product suggestions",
        from_email: "parse@cloudcode.com",
        from_name: "Cloud Code",
        to: [
          {
            email: "namrata@ajency.in",
            name: "Your Name"
          }
        ]
      },
      async: true
    }, {
      success: function(httpResponse) {
        console.log(httpResponse);
        return status.success('Mail Sent');
      },
      error: function(httpResponse) {
        console.error(httpResponse);
        return status.error('err');
      }
    });
  });

  getNotificationData = function(notificationId, installationId, pushOptions) {
    var installationQuery, promise;
    promise = new Parse.Promise();
    installationQuery = new Parse.Query(Parse.Installation);
    installationQuery.equalTo("installationId", installationId);
    installationQuery.find().then(function(installationObject) {
      var deviceType, notificationObj, pushData;
      if (_.isEmpty(installationObject)) {
        deviceType = 'unknown';
      } else {
        deviceType = installationObject[0].get('deviceType');
      }
      if (deviceType.toLowerCase() === 'android') {
        pushData = {
          header: pushOptions.title,
          message: pushOptions.alert,
          data: pushOptions.notificationData
        };
      } else {
        pushData = {
          title: pushOptions.title,
          alert: pushOptions.alert,
          data: pushOptions.notificationData,
          badge: 'Increment'
        };
      }
      notificationObj = {
        pushData: pushData,
        installationId: installationId,
        notificationId: notificationId
      };
      return promise.resolve(notificationObj);
    }, function(error) {
      return promise.reject(error);
    });
    return promise;
  };

  processPushNotifications = function(installationId, pushData, notificationId) {
    var promise, pushQuery;
    promise = new Parse.Promise();
    pushQuery = new Parse.Query(Parse.Installation);
    pushQuery.equalTo("installationId", installationId);
    Parse.Push.send({
      where: pushQuery,
      data: pushData
    }).then(function() {
      var Notification, query;
      Notification = Parse.Object.extend('Notification');
      query = new Parse.Query(Notification);
      query.equalTo("objectId", notificationId);
      return query.first().then(function(notification) {
        notification.set("processed", true);
        return notification.save().then(function(notifobj) {
          return promise.resolve(notifobj);
        }, function(error) {
          return promise.reject(error);
        });
      }, function(error) {
        return promise.reject(error);
      });
    }, function(error) {
      return promise.reject(error);
    });
    return promise;
  };

  Parse.Cloud.job('processNotifications', function(request, response) {
    var notificationQuery;
    notificationQuery = new Parse.Query("Notification");
    notificationQuery.equalTo("processed", false);
    notificationQuery.include("recipientUser");
    notificationQuery.include("requestObject");
    notificationQuery.include("offerObject");
    return notificationQuery.find().then(function(pendingNotifications) {
      var notificationQs;
      notificationQs = [];
      _.each(pendingNotifications, function(pendingNotification) {
        var channel, msg, notificationId, notificationPromise, obj, otherPushData, pushOptions, recipientUser, type, userInstallationId;
        channel = pendingNotification.get("channel");
        recipientUser = pendingNotification.get("recipientUser");
        notificationId = pendingNotification.id;
        userInstallationId = recipientUser.get("installationId");
        type = pendingNotification.get("type");
        if (type === "Request") {
          obj = pendingNotification.get("requestObject");
          msg = "New request for a product";
          otherPushData = {
            "id": obj.id,
            "type": "new_request"
          };
        } else if (type === "Offer") {
          obj = pendingNotification.get("offerObject");
          msg = "New offer for a product";
          otherPushData = {
            "id": obj.id,
            "type": "new_offer"
          };
        }
        switch (channel) {
          case 'push':
            pushOptions = {
              title: 'Shop Oye',
              alert: msg,
              notificationData: otherPushData
            };
            notificationPromise = getNotificationData(notificationId, userInstallationId, pushOptions);
            return notificationQs.push(notificationPromise);
          case 'sms':
            return console.log("send sms");
        }
      });
      return Parse.Promise.when(notificationQs).then(function() {
        var individualPushResults, pushQs;
        individualPushResults = _.flatten(_.toArray(arguments));
        pushQs = [];
        _.each(individualPushResults, function(pushResult) {
          var installationId, notificationId, pushNotifPromise;
          installationId = pushResult.installationId;
          notificationId = pushResult.notificationId;
          pushNotifPromise = processPushNotifications(installationId, pushResult.pushData, notificationId);
          return pushQs.push(pushNotifPromise);
        });
        return Parse.Promise.when(pushQs).then(function() {
          return response.success("Processed");
        }, function(error) {
          return response.error(error);
        });
      }, function(error) {
        return response.error("Error");
      });
    }, function(error) {
      return response.error(error);
    });
  });

  Parse.Cloud.define('getUnseenNotifications', function(request, response) {
    var innerQueryUser, notificationQuery, type, userId;
    userId = request.params.userId;
    type = request.params.type;
    notificationQuery = new Parse.Query("Notification");
    notificationQuery.equalTo("hasSeen", false);
    innerQueryUser = new Parse.Query(Parse.User);
    innerQueryUser.equalTo("objectId", userId);
    notificationQuery.matchesQuery("recipientUser", innerQueryUser);
    notificationQuery.equalTo("type", type);
    notificationQuery.select("requestObject");
    return notificationQuery.find().then(function(notificationResults) {
      var unseenNotifications;
      unseenNotifications = _.map(notificationResults, function(notificationObj) {
        var requestId;
        return requestId = notificationObj.get("requestObject").id;
      });
      return response.success(unseenNotifications);
    }, function(error) {
      return response.error(error);
    });
  });

  Parse.Cloud.define('updateNotificationStatus', function(request, response) {
    var hasSeen, innerQuery, notificationQuery, notificationType, notificationTypeId, recipientId, recipientUserObj;
    notificationType = request.params.notificationType;
    notificationTypeId = request.params.notificationTypeId;
    recipientId = request.params.recipientId;
    hasSeen = request.params.hasSeen;
    notificationQuery = new Parse.Query("Notification");
    notificationQuery.equalTo("type", notificationType);
    recipientUserObj = {
      "__type": "Pointer",
      "className": "_User",
      "objectId": recipientId
    };
    notificationQuery.equalTo("recipientUser", recipientUserObj);
    if (notificationType === "Request") {
      innerQuery = new Parse.Query("Request");
      innerQuery.equalTo("objectId", notificationTypeId);
      notificationQuery.matchesQuery("requestObject", innerQuery);
    }
    return notificationQuery.first().then(function(notificationObj) {
      notificationObj.set("hasSeen", hasSeen);
      return notificationObj.save().then(function(notif) {
        return response.success(notif);
      }, function(error) {
        return response.error(error);
      });
    }, function(error) {
      return response.error(error);
    });
  });

  Parse.Cloud.define('getNewOffers', function(request, response) {
    var currentDate, currentTimeStamp, customerId, expiryValueInHrs, innerCustomerQuery, innerProductQuery, productId, queryDate, queryRequest, time24HoursAgo;
    productId = request.params.productId;
    customerId = request.params.customerId;
    queryRequest = new Parse.Query("Request");
    innerProductQuery = new Parse.Query("ProductItem");
    innerProductQuery.equalTo("objectId", productId);
    innerCustomerQuery = new Parse.Query(Parse.User);
    innerCustomerQuery.equalTo("objectId", customerId);
    queryRequest.matchesQuery("product", innerProductQuery);
    queryRequest.matchesQuery("customerId", innerCustomerQuery);
    currentDate = new Date();
    currentTimeStamp = currentDate.getTime();
    expiryValueInHrs = 24;
    queryDate = new Date();
    time24HoursAgo = currentTimeStamp - (expiryValueInHrs * 60 * 60 * 1000);
    queryDate.setTime(time24HoursAgo);
    queryRequest.greaterThanOrEqualTo("createdAt", queryDate);
    queryRequest.descending("createdAt");
    return queryRequest.find().then(function(allNonExpiredRequests) {
      var innerRequestQuery, mostRecentRequest, queryOffer, recentRequestStatus, result;
      if (allNonExpiredRequests.length === 0) {
        result = {
          "recentRequest": [],
          "offers": []
        };
        return response.success(result);
      } else {
        mostRecentRequest = allNonExpiredRequests[0];
        recentRequestStatus = mostRecentRequest.get("status");
        if (recentRequestStatus === "open") {
          queryOffer = new Parse.Query("Offer");
          innerRequestQuery = new Parse.Query("Request");
          innerRequestQuery.equalTo("objectId", mostRecentRequest.id);
          queryOffer.matchesQuery("request", innerRequestQuery);
          queryOffer.equalTo("status", "open");
          return queryOffer.find().then(function(offers) {
            result = {
              "recentRequest": mostRecentRequest,
              "offers": offers
            };
            return response.success(result);
          }, function(error) {
            return response.error(error);
          });
        } else {
          result = {
            "recentRequest": mostRecentRequest,
            "offers": []
          };
          return response.success(result);
        }
      }
    }, function(error) {
      return response.error(error);
    });
  });

  Parse.Cloud.define('makeOffer', function(request, response) {
    var Notification, Offer, Price, Request, comments, deliveryTime, priceValue, requestId, requestQuery, sellerId, status;
    requestId = request.params.requestId;
    sellerId = request.params.sellerId;
    priceValue = parseInt(request.params.priceValue);
    deliveryTime = request.params.deliveryTime;
    comments = request.params.comments;
    status = request.params.status;
    Price = Parse.Object.extend("Price");
    Offer = Parse.Object.extend("Offer");
    Request = Parse.Object.extend("Request");
    Notification = Parse.Object.extend("Notification");
    requestQuery = new Parse.Query("Request");
    requestQuery.equalTo("objectId", requestId);
    return requestQuery.first().then(function(requestObj) {
      var price, product, requestingCustomer, sellerObj;
      requestingCustomer = requestObj.get("customerId");
      price = new Price();
      price.set("source", "seller");
      sellerObj = new Parse.User();
      sellerObj.id = sellerId;
      price.set("seller", sellerObj);
      price.set("type", "open_offer");
      price.set("value", priceValue);
      product = requestObj.get("product");
      price.set("product", product);
      return price.save().then(function(priceObj) {
        var offer;
        offer = new Offer();
        requestObj = new Request();
        requestObj.id = requestId;
        offer.set("request", requestObj);
        offer.set("price", priceObj);
        offer.set("status", status);
        offer.set("deliveryTime", deliveryTime);
        offer.set("comments", comments);
        return offer.save().then(function(offerObj) {
          var notification;
          notification = new Notification();
          notification.set("hasSeen", false);
          notification.set("recipientUser", requestingCustomer);
          notification.set("channel", "push");
          notification.set("processed", false);
          notification.set("type", "Offer");
          notification.set("offerObject", offerObj);
          return notification.save().then(function(notificationObj) {
            return response.success(notificationObj);
          }, function(error) {
            return response.error(error);
          });
        }, function(error) {
          return response.error(error);
        });
      }, function(error) {
        return response.error(error);
      });
    }, function(error) {
      return response.error(error);
    });
  });

  Parse.Cloud.job('productImport', function(request, response) {
    var ProductItem, productSavedArr, products;
    ProductItem = Parse.Object.extend('ProductItem');
    productSavedArr = [];
    products = request.params.products;
    _.each(products, function(product) {
      var attributeValueArr, attributes, brandObj, categoryObj, primaryAttributeValueArr, primaryAttributes, productItem;
      productItem = new ProductItem();
      productItem.set("name", product.name);
      productItem.set("images", product.images);
      productItem.set("model_number", product.model_number);
      productItem.set("mrp", parseInt(product.mrp));
      productItem.set("popularity", product.popularity);
      productItem.set("group", product.group);
      categoryObj = {
        "__type": "Pointer",
        "className": "Category",
        "objectId": product.category
      };
      productItem.set("category", categoryObj);
      brandObj = {
        "__type": "Pointer",
        "className": "Brand",
        "objectId": product.brand
      };
      productItem.set("brand", brandObj);
      primaryAttributeValueArr = [];
      primaryAttributes = product.primaryAttributes;
      _.each(primaryAttributes, function(primaryAttributeId) {
        var attribObj;
        attribObj = {
          "__type": "Pointer",
          "className": "AttributeValues",
          "objectId": primaryAttributeId
        };
        return primaryAttributeValueArr.push(attribObj);
      });
      productItem.set("primaryAttributes", primaryAttributeValueArr);
      attributeValueArr = [];
      attributes = product.attrs;
      _.each(attributes, function(attributeId) {
        var attribObj;
        attribObj = {
          "__type": "Pointer",
          "className": "AttributeValues",
          "objectId": attributeId
        };
        return attributeValueArr.push(attribObj);
      });
      productItem.set("attrs", attributeValueArr);
      return productSavedArr.push(productItem);
    });
    return Parse.Object.saveAll(productSavedArr, {
      success: function(objs) {
        response.success("Successfully added the products");
      },
      error: function(error) {
        return response.error("Failed to add products due to - " + error.message);
      }
    });
  });

  Parse.Cloud.define('getProducts', function(request, response) {
    var ascending, categoryId, displayLimit, filterableAttribQuery, findFilterableAttrib, page, selectedFilters, sortBy;
    categoryId = request.params.categoryId;
    selectedFilters = request.params.selectedFilters;
    sortBy = request.params.sortBy;
    ascending = request.params.ascending;
    page = parseInt(request.params.page);
    displayLimit = parseInt(request.params.displayLimit);
    filterableAttribQuery = new Parse.Query("Category");
    filterableAttribQuery.equalTo("objectId", categoryId);
    filterableAttribQuery.select("filterable_attributes");
    filterableAttribQuery.select("supported_brands");
    filterableAttribQuery.select("price_range");
    filterableAttribQuery.include("filterable_attributes");
    filterableAttribQuery.include("supported_brands");
    findFilterableAttrib = filterableAttribQuery.first();
    findFilterableAttrib.done((function(_this) {
      return function(categoryData) {
        var AttributeValues, ProductItem, brand, endPrice, filterableProps, filters, innerBrandQuery, innerQuery, otherFilters, price, price_range, query, queryFindPromise, startPrice, supported_brands;
        filters = categoryData.get("filterable_attributes");
        supported_brands = categoryData.get("supported_brands");
        price_range = categoryData.get("price_range");
        ProductItem = Parse.Object.extend("ProductItem");
        innerQuery = new Parse.Query("Category");
        innerQuery.equalTo("objectId", categoryId);
        query = new Parse.Query("ProductItem");
        query.matchesQuery("category", innerQuery);
        if ((selectedFilters !== "all") && (_.isObject(selectedFilters))) {
          filterableProps = Object.keys(selectedFilters);
          if (_.contains(filterableProps, "brand")) {
            brand = selectedFilters["brand"];
            innerBrandQuery = new Parse.Query("Brand");
            innerBrandQuery.equalTo("objectId", brand);
            query.matchesQuery("brand", innerBrandQuery);
          }
          if (_.contains(filterableProps, "price")) {
            price = selectedFilters["price"];
            startPrice = parseInt(price[0]);
            endPrice = parseInt(price[1]);
            query.greaterThanOrEqualTo("mrp", startPrice);
            query.lessThanOrEqualTo("mrp", endPrice);
          }
          if (_.contains(filterableProps, "other_filters")) {
            AttributeValues = Parse.Object.extend('AttributeValues');
            otherFilters = selectedFilters['other_filters'];
            _.each(otherFilters, function(sameAttribFilters) {
              var attribValuePointers;
              AttributeValues = Parse.Object.extend("AttributeValues");
              attribValuePointers = [];
              attribValuePointers = _.map(sameAttribFilters, function(attribValueId) {
                var AttributeValuePointer;
                AttributeValuePointer = new AttributeValues();
                AttributeValuePointer.id = attribValueId;
                return AttributeValuePointer;
              });
              return query.containedIn('attrs', attribValuePointers);
            });
          }
        }
        query.select("images,name,mrp,brand,primaryAttributes");
        query.include("brand");
        query.include("primaryAttributes");
        query.include("primaryAttributes.attribute");
        query.limit(displayLimit);
        query.skip(page * displayLimit);
        if (ascending === true) {
          query.ascending(sortBy);
        } else {
          query.descending(sortBy);
        }
        queryFindPromise = query.find();
        queryFindPromise.done(function(products) {
          var result;
          result = {
            products: products,
            filters: filters,
            supportedBrands: supported_brands,
            priceRange: price_range,
            sortableAttributes: ["mrp", "popularity"]
          };
          return response.success(result);
        });
        return queryFindPromise.fail(function(error) {
          return response.error(error.message);
        });
      };
    })(this));
    return findFilterableAttrib.fail((function(_this) {
      return function(error) {
        return response.error(error.message);
      };
    })(this));
  });

  Parse.Cloud.define('getProduct', function(request, response) {
    var ProductItem, productId, queryProductItem;
    productId = request.params.productId;
    ProductItem = Parse.Object.extend("ProductItem");
    queryProductItem = new Parse.Query(ProductItem);
    queryProductItem.equalTo("objectId", productId);
    queryProductItem.include("attrs");
    queryProductItem.include("brand");
    queryProductItem.include("attrs.attribute");
    queryProductItem.include("category");
    queryProductItem.include("primaryAttributes");
    return queryProductItem.first().then(function(ProductData) {
      return response.success(ProductData);
    }, function(error) {
      return response.error(error);
    });
  });

  Parse.Cloud.define('makeRequest', function(request, response) {
    var Request, address, area, brandId, brandObj, categoryId, categoryObj, city, comments, customerId, customerObj, deliveryStatus, location, point, productId, productObj, status;
    customerId = request.params.customerId;
    productId = request.params.productId;
    categoryId = request.params.categoryId;
    brandId = request.params.brandId;
    location = request.params.location;
    address = request.params.address;
    city = request.params.city;
    area = request.params.area;
    comments = request.params.comments;
    status = request.params.status;
    deliveryStatus = request.params.deliveryStatus;
    Request = Parse.Object.extend('Request');
    request = new Request();
    point = new Parse.GeoPoint(location);
    request.set("addressGeoPoint", point);
    request.set("address", address);
    request.set("status", status);
    request.set("deliveryStatus", deliveryStatus);
    request.set("city", city);
    request.set("area", area);
    request.set("comments", comments);
    customerObj = {
      "__type": "Pointer",
      "className": "_User",
      "objectId": customerId
    };
    request.set("customerId", customerObj);
    productObj = {
      "__type": "Pointer",
      "className": "ProductItem",
      "objectId": productId
    };
    request.set("product", productObj);
    categoryObj = {
      "__type": "Pointer",
      "className": "Category",
      "objectId": categoryId
    };
    request.set("category", categoryObj);
    brandObj = {
      "__type": "Pointer",
      "className": "Brand",
      "objectId": brandId
    };
    request.set("brand", brandObj);
    return request.save().then(function(requestObject) {
      var createdRequestId, sellersArray;
      createdRequestId = requestObject.id;
      city = requestObject.get("city");
      area = requestObject.get("area");
      sellersArray = [];
      return getCategoryBasedSellers(point, categoryId, brandId, city, area).then(function(categoryBasedSellers) {
        var findQs;
        findQs = [];
        findQs = _.map(categoryBasedSellers, function(catBasedSeller) {
          var sellerGeoPoint, sellerId, sellerRadius;
          sellerId = catBasedSeller.id;
          sellerGeoPoint = catBasedSeller.get("addressGeoPoint");
          sellerRadius = catBasedSeller.get("deliveryRadius");
          return getAreaBoundSellers(sellerId, sellerGeoPoint, sellerRadius, createdRequestId, customerObj);
        });
        return Parse.Promise.when(findQs).then(function() {
          var locationBasedSellerIds, notificationSavedArr;
          locationBasedSellerIds = _.flatten(_.toArray(arguments));
          notificationSavedArr = [];
          _.each(locationBasedSellerIds, function(locationBasedSellerId) {
            var Notification, notification, notificationData, sellerObj;
            if (locationBasedSellerId) {
              sellerObj = {
                "__type": "Pointer",
                "className": "_User",
                "objectId": locationBasedSellerId
              };
              requestObject = {
                "__type": "Pointer",
                "className": "Request",
                "objectId": createdRequestId
              };
              notificationData = {
                hasSeen: false,
                recipientUser: sellerObj,
                channel: 'push',
                processed: false,
                type: "Request",
                requestObject: requestObject
              };
              Notification = Parse.Object.extend("Notification");
              notification = new Notification(notificationData);
              return notificationSavedArr.push(notification);
            }
          });
          return Parse.Object.saveAll(notificationSavedArr).then(function(objs) {
            return response.success(objs);
          }, function(error) {
            return response.error(error);
          });
        }, function(error) {
          return response.error(error);
        });
      }, function(error) {
        return response.error(error);
      });
    }, function(error) {
      return response.error(error);
    });
  });

  Parse.Cloud.define('getNewRequests', function(request, response) {
    var area, city, sellerId, sellerLocation, sellerQuery, sellerRadius, status;
    sellerId = request.params.sellerId;
    city = request.params.city;
    area = request.params.area;
    sellerLocation = request.params.sellerLocation;
    sellerRadius = request.params.sellerRadius;
    status = "open";
    sellerQuery = new Parse.Query(Parse.User);
    sellerQuery.equalTo("objectId", sellerId);
    return sellerQuery.first().then(function(sellerObject) {
      var currentDate, currentTimeStamp, expiryValueInHrs, queryDate, requestQuery, sellerBrands, sellerCategories, sellerGeoPoint, time24HoursAgo;
      sellerCategories = sellerObject.get("supportedCategories");
      sellerBrands = sellerObject.get("supportedBrands");
      if (city === 'default') {
        city = sellerObject.get("city");
      }
      if (area === 'default') {
        area = sellerObject.get("area");
      }
      if (sellerLocation === 'default') {
        sellerLocation = sellerObject.get("addressGeoPoint");
      } else {
        sellerLocation = request.params.sellerLocation;
      }
      if (sellerRadius === 'default') {
        sellerRadius = sellerObject.get("deliveryRadius");
      } else {
        sellerRadius = parseInt(request.params.sellerRadius);
      }
      requestQuery = new Parse.Query("Request");
      requestQuery.containedIn("category", sellerCategories);
      requestQuery.containedIn("brand", sellerBrands);
      requestQuery.equalTo("city", city);
      requestQuery.equalTo("area", area);
      requestQuery.equalTo("status", status);
      currentDate = new Date();
      currentTimeStamp = currentDate.getTime();
      expiryValueInHrs = 24;
      queryDate = new Date();
      time24HoursAgo = currentTimeStamp - (expiryValueInHrs * 60 * 60 * 1000);
      queryDate.setTime(time24HoursAgo);
      requestQuery.greaterThanOrEqualTo("createdAt", queryDate);
      sellerGeoPoint = new Parse.GeoPoint(sellerLocation);
      requestQuery.withinKilometers("addressGeoPoint", sellerGeoPoint, sellerRadius);
      requestQuery.select("address,addressGeoPoint,category,brand,product,customerId");
      requestQuery.include("product");
      requestQuery.include("category");
      requestQuery.include("category.parent_category");
      requestQuery.include("brand");
      return requestQuery.find().then(function(filteredRequests) {
        var requests, requestsResult;
        requests = [];
        _.each(filteredRequests, function(filteredRequest) {
          var brand, brandObj, category, categoryObj, prodObj, product, radiusDiffInKm, requestObj, reuqestGeoPoint;
          prodObj = filteredRequest.get("product");
          product = {
            "id": prodObj.id,
            "name": prodObj.get("name"),
            "mrp": prodObj.get("mrp"),
            "image": prodObj.get("images")
          };
          categoryObj = filteredRequest.get("category");
          category = {
            "id": categoryObj.id,
            "name": categoryObj.get("name"),
            "parent": (categoryObj.get("parent_category")).get("name")
          };
          brandObj = filteredRequest.get("brand");
          brand = {
            "id": brandObj.id,
            "name": brandObj.get("name")
          };
          reuqestGeoPoint = filteredRequest.get("addressGeoPoint");
          radiusDiffInKm = reuqestGeoPoint.kilometersTo(sellerGeoPoint);
          requestObj = {
            id: filteredRequest.id,
            radius: radiusDiffInKm,
            product: product,
            category: category,
            brand: brand,
            createdAt: filteredRequest.createdAt
          };
          return requests.push(requestObj);
        });
        requestsResult = {
          "city": city,
          "area": area,
          "radius": sellerRadius,
          "location": sellerLocation,
          "requests": requests
        };
        return response.success(requestsResult);
      }, function(error) {
        return response.error(error);
      });
    }, function(error) {
      return response.error(error);
    });
  });

  getCategoryBasedSellers = function(geoPoint, categoryId, brandId, city, area) {
    var Brand, Category, brandPointer, categoryPointer, promise, sellerQuery;
    sellerQuery = new Parse.Query(Parse.User);
    Category = Parse.Object.extend("Category");
    categoryPointer = new Category();
    categoryPointer.id = categoryId;
    Brand = Parse.Object.extend("Brand");
    brandPointer = new Brand();
    brandPointer.id = brandId;
    sellerQuery.equalTo("userType", "seller");
    sellerQuery.equalTo("city", city);
    sellerQuery.equalTo("area", area);
    sellerQuery.equalTo("supportedCategories", categoryPointer);
    sellerQuery.equalTo("supportedBrands", brandPointer);
    promise = new Parse.Promise();
    sellerQuery.find().then(function(sellers) {
      if (sellers.length === 0) {
        return promise.resolve();
      } else {
        return promise.resolve(sellers);
      }
    }, function(error) {
      return promise.reject(error);
    });
    return promise;
  };

  getAreaBoundSellers = function(sellerId, sellerGeoPoint, sellerRadius, createdRequestId, customerObj) {
    var promise, requestQuery;
    requestQuery = new Parse.Query("Request");
    requestQuery.equalTo("objectId", createdRequestId);
    requestQuery.equalTo("customerId", customerObj);
    requestQuery.equalTo("status", "open");
    requestQuery.withinKilometers("addressGeoPoint", sellerGeoPoint, sellerRadius);
    promise = new Parse.Promise();
    requestQuery.find().then(function(requests) {
      if (requests.length === 0) {
        return promise.resolve();
      } else {
        return promise.resolve(sellerId);
      }
    }, function(error) {
      return promise.reject(error);
    });
    return promise;
  };

  Parse.Cloud.define('createTestSeller', function(request, response) {
    var addressGeoPoint, supportedBrands, supportedBrandsArr, supportedCategories, supportedCategoriesArr, user, userData;
    addressGeoPoint = new Parse.GeoPoint(request.params.addressLocation);
    userData = {
      'username': request.params.username,
      'password': request.params.password,
      'email': request.params.email,
      'addressGeoPoint': addressGeoPoint,
      'address': request.params.address,
      'city': request.params.city,
      'deliveryRadius': request.params.deliveryRadius
    };
    supportedCategoriesArr = [];
    supportedCategories = request.params.supportedCategories;
    _.each(supportedCategories, function(catId) {
      var catObj;
      catObj = {
        "__type": "Pointer",
        "className": "Category",
        "objectId": catId
      };
      return supportedCategoriesArr.push(catObj);
    });
    userData["supportedCategories"] = supportedCategoriesArr;
    supportedBrandsArr = [];
    supportedBrands = request.params.supportedBrands;
    _.each(supportedBrands, function(brandId) {
      var brandObj;
      brandObj = {
        "__type": "Pointer",
        "className": "Brand",
        "objectId": brandId
      };
      return supportedBrandsArr.push(brandObj);
    });
    userData["supportedBrands"] = supportedBrandsArr;
    userData["userType"] = "seller";
    user = new Parse.User(userData);
    return user.signUp().done((function(_this) {
      return function(user) {
        return response.success(user);
      };
    })(this)).fail((function(_this) {
      return function(error) {
        return response.error("Failed to create user " + error.message);
      };
    })(this));
  });

  Parse.Cloud.useMasterKey();

  Parse.Cloud.define("sendSMSCode", function(request, response) {
    var code, onError, phone, query, save;
    phone = request.params.phone;
    code = (Math.floor(Math.random() * 900000) + 100000).toString();
    onError = function(error) {
      return response.error(error);
    };
    save = function(obj, attempts) {
      if (attempts > 3) {
        return response.success({
          attemptsExceeded: true
        });
      } else {
        return obj.save({
          'phone': phone,
          'verificationCode': code,
          'attempts': attempts
        }).then(function() {
          return response.success({
            code: code,
            attemptsExceeded: false
          });
        }, onError);
      }
    };
    query = new Parse.Query('SMSVerify');
    query.equalTo("phone", phone);
    return query.find().then(function(obj) {
      var SMSVerify, attempts, verify;
      if (_.isEmpty(obj)) {
        SMSVerify = Parse.Object.extend("SMSVerify");
        verify = new SMSVerify();
        return save(verify, 1);
      } else {
        obj = obj[0];
        attempts = obj.get('attempts');
        return save(obj, attempts + 1);
      }
    }, onError);
  });

  Parse.Cloud.afterSave("SMSVerify", function(request) {
    var obj, phone, verificationCode;
    obj = request.object;
    phone = obj.get('phone');
    verificationCode = obj.get('verificationCode');
    return Parse.Cloud.httpRequest({
      url: 'https://rest.nexmo.com/sms/json',
      params: {
        api_key: 'e2f79907',
        api_secret: '88907392',
        from: 'ShopOye',
        to: "91" + phone,
        text: "Welcome to ShopOye. Your one time verification code is " + verificationCode
      }
    }).then(function(httpResponse) {
      return console.log("SMS Sent: " + phone);
    }, function(httpResponse) {
      return console.log("SMS Error");
    });
  });

  Parse.Cloud.define("verifySMSCode", function(request, response) {
    var code, phone, query;
    phone = request.params.phone;
    code = request.params.code;
    query = new Parse.Query('SMSVerify');
    query.equalTo("phone", phone);
    return query.find().then(function(obj) {
      var verificationCode, verified;
      obj = obj[0];
      verificationCode = obj.get('verificationCode');
      verified = verificationCode === code ? true : false;
      if (verified) {
        obj.destroy();
      }
      return response.success({
        'verified': verified
      });
    }, function(error) {
      return response.error(error);
    });
  });

}).call(this);
