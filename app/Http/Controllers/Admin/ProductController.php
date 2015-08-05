<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Admin\AttributeController;
 
use \PHPExcel;
use Parse\ParseObject;
use Parse\ParseQuery;
use \Session;
use \Input;
use App\Http\Helper\FormatPhpExcel;

class ProductController extends Controller
{
		/**
		 * Display a listing of the resource.
		 *
		 * @return Response
		 */
		public function index()
		{
				//
		}

		/**
		 * Show the form for creating a new resource.
		 *
		 * @return Response
		 */
		public function create()
		{
				//
		}

		/**
		 * Store a newly created resource in storage.
		 *
		 * @return Response
		 */
		public function store()
		{
				//
		}

		/**
		 * Display the specified resource.
		 *
		 * @param  int  $id
		 * @return Response
		 */
		public function show($id)
		{
				//
		}

		/**
		 * Show the form for editing the specified resource.
		 *
		 * @param  int  $id
		 * @return Response
		 */
		public function edit($id)
		{
				//
		}

		/**
		 * Update the specified resource in storage.
		 *
		 * @param  int  $id
		 * @return Response
		 */
		public function update($id)
		{
				//
		}

		/**
		 * Remove the specified resource from storage.
		 *
		 * @param  int  $id
		 * @return Response
		 */
		public function destroy($id)
		{
				//
		}
		
		 public function exportProducts($catId)
		{  
				$attributeController = new AttributeController(); 
				
				$excel = new PHPExcel(); // ea is short for Excel Application
				$excel->getProperties()
													 ->setCreator('Prajay Verenkar')
													 ->setTitle('PHPExcel Attributes')
													 ->setLastModifiedBy('Prajay Verenkar')
													 ->setDescription('A demo to show how to use PHPExcel to manipulate an Excel file')
													 ->setSubject('PHP Excel manipulation')
													 ->setKeywords('excel php office phpexcel lakers')
													 ->setCategory('programming');
 
				
				 
				$indexSheet = $excel->getSheet(0);
				$indexSheet->setTitle('Index');
				
				$brandIndexData =[];
				$brands = $attributeController->getCategoryBrands($catId);
				
				foreach($brands as $key=> $brand)
				{
						$brandIndexData[] = ['name'=>$brand["name"],'id'=>$brand["id"]]; 
				}
 
				$labels = [];
				$headers = [];
				$headers []= 'Config' ;
				$headers []= 'Brand' ;
				$headers []= 'Brand id' ;
				 
				$categoryData = [
					'categoryId' => $catId,
					'filterableAttributes' => true,
					'secondaryAttributes' => true,
					];
				$attributeValueData = $attributeController->getCategoryAttributeValues($categoryData);  
				$attributeValues= $headerFlag =$productHeader = $productAttributeIds = [];

				$labelsHeader = array();

				if(isset($attributeValueData['result']))
				{  
					foreach($attributeValueData['result']['attributeValues'] as $attributeValue)
					{
						$attributeId =$attributeValue['attributeId'];


						$productAttributeIds [$attributeId]=[];

						$headerFlag[$attributeId]=[];

						$attributeValues[$attributeId][] = [$attributeValue['value'],$attributeValue['valueId']];  

					} 

					foreach($attributeValueData['result']['attributes'] as $attribute)
					{
						$attributeId = $attribute['id'];
						$headerFlag[$attributeId] = $attribute;  
						$productAttributeIds[$attributeId]=[];           
					}



					foreach($headerFlag as $attribute)
					{
						$attributeId = $attribute['id'];
						$attributeName = $attribute['name'];

						$headers[]=$attributeName;
						$headers[]=$attributeName.' Id';

						$productHeader[]=$attributeName."(".$attributeId.")";
						$productHeader[]=$attributeName.' Id';

						$labelsHeader[] = $attributeName;
						$labelsHeader[] = $attributeName.' Id';

					}          
				}
				 
				// dd($productAttributeIds);
				$indexSheet->fromArray($headers, ' ', 'A1');
				$indexSheet->fromArray([$catId], ' ', 'A2');
				$indexSheet->getColumnDimension('A')->setVisible(false);
				$indexSheet->getColumnDimension('C')->setVisible(false);
				$indexSheet->fromArray($brandIndexData, ' ','B2');
				
				$column = 'D';
				foreach($attributeValues as $attributeValue)
				{
						$indexSheet->fromArray($attributeValue, ' ', $column.'2');
						
						//hide column
						$hidecolumn = $attributeController->getNextCell($column,'1');
						$indexSheet->getColumnDimension($hidecolumn)->setVisible(false);
						
						$column = $attributeController->getNextCell($column,'2');
						
		
				}
 
				$lastColumn = $indexSheet->getHighestColumn();
				$header = 'a1:'.$lastColumn.'1';
				$indexSheet->getStyle($header)->getFill()->setFillType(\PHPExcel_Style_Fill::FILL_SOLID)->getStartColor()->setARGB('00ffff00');
				$style = array(
						'font' => array('bold' => true,),
						'alignment' => array('horizontal' => \PHPExcel_Style_Alignment::HORIZONTAL_CENTER,),
						);
				$indexSheet->getStyle($header)->applyFromArray($style);


				//Hide the sheet
				$indexSheet->setSheetState(\PHPExcel_Worksheet::SHEETSTATE_HIDDEN);
				//$indexSheet->getProtection()->setSheet(true);
				 
				 /***
				 * PRODUCTS SHEET
				 *
				 */
				 
				$productSheet = new \PHPExcel_Worksheet($excel, 'Products');
				$excel->addSheet($productSheet, 0);
				$productSheet->setTitle('Products');
				
				$products = $productsData = $headers = [];

				$labels []= 'Config' ;
				$labels []= 'ProductID' ; 
				$labels []= 'Product Name' ;
				$labels []= 'Model Number' ;
				$labels []= 'Image' ; 
				$labels []= 'MRP' ; 
				$labels []= 'Review Count' ; //Popularity is called review count
				$labels []= 'Brand' ;  
				$labels []= 'Brand ID' ; 
				$labels []= 'Group' ;


				$headers []= 'Config' ;
				$headers []= 'ProductID' ; 
				$headers []= 'ProductName' ;
				$headers []= 'ModelNumber' ;
				$headers []= 'Image' ; 
				$headers []= 'MRP' ; 
				$headers []= 'Popularity' ; 
				$headers []= 'Brand' ;  
				$headers []= 'BrandID' ; 
				$headers []= 'Group' ;
			 
				$headers = array_merge($headers,$productHeader);

				$labels = array_merge($labels,$labelsHeader); 
			
				$productSheet->fromArray($labels, ' ', 'A1');
				$productSheet->fromArray($headers, ' ', 'A2');
				$productSheet->fromArray([$catId], ' ', 'A3');
				$productSheet->getColumnDimension('A')->setVisible(false);
				$productSheet->getColumnDimension('B')->setVisible(false);
				$productSheet->getColumnDimension('I')->setVisible(false); 
				
				$column = 'K';  
				for($i=0; $i<(count($productHeader)/2) ;$i++)
				{
 
						//hide column
						$hidecolumn = $attributeController->getNextCell($column,'3');
						//$productSheet->getColumnDimension($hidecolumn)->setVisible(false);
						$column = $attributeController->getNextCell($column,'2');
				}
				
			 
				$limit =10;
				$page = 0; 
				$i=0; 
				 while (true) {
							$limit = $limit + 50;
							$products = $this->getCategoryProducts($catId, $page, $limit) ;
							
							if(empty($products))
									break;
	 
							foreach($products as $key=> $product) 
							{
									$productsData[$i][]=$product['objectId']; 
									$productsData[$i][]=$product['name'];  
									$productsData[$i][]=$product['model_number'];  
									$productsData[$i][]=$product['images'][0]['src']; 
									$productsData[$i][]=$product['mrp'];
									$productsData[$i][]=$product['popularity']; 
									$productsData[$i][]=$product['brandName']; 
									$productsData[$i][]=$product['brandId']; 
									$productsData[$i][]=$product['group']; 

									foreach($product['attrs'] as $attribute)
									{
											if(isset($productAttributeIds[$attribute['attributeId']]))
											{
													$productAttributeIds[$attribute['attributeId']]=['value'=>$attribute['attributeValue'],'id'=>$attribute['attributeValueId']];
											}

									}

									foreach ($product['textAttributes'] as $text_attrib_id => $text_attribute_value) {
										if(isset($productAttributeIds[$text_attrib_id]))
											{
												$productAttributeIds[$text_attrib_id]=['value'=>$text_attribute_value,'id'=>$text_attrib_id];
											}
									}

									foreach($productAttributeIds as $productAttribute)
									{

											$productsData[$i][] = (isset($productAttribute["value"]))?$productAttribute["value"]:"";
											$productsData[$i][] = (isset($productAttribute["id"]))?$productAttribute["id"]:"";
									}

									$i++;
							}
	 
							$page++;
					}
				
					$productSheet->fromArray($productsData, ' ', 'B3');


					//freeze pan
					$productSheet->getStyle('1:1')->getFont()->setBold(true);
					$productSheet->freezePane('E2');

					//Headr row height
					$productSheet->getRowDimension('1')->setRowHeight(22);

					//Hide second row
					$productSheet->getRowDimension(2)->setVisible(false);

					//Format sheet
					FormatPhpExcel::formatSheet($productSheet, 'Products', $headerFlag, $indexSheet);

					//Format header row
					FormatPhpExcel::format_header_row($productSheet, array(
						'background_color'=>'FFFF00',
						'border_color'=>'000000',
						'font_size'=>'9',
						'font_color'=>'000000',
						'vertical_alignment'=>'VERTICAL_CENTER',
						'font-weight'=>'bold'
						), '1'
					);
				 
					 
				
					
					$productSheet->protectCells($header, 'PHP');
					
					
					header('Content-Type: application/vnd.ms-excel');
					header('Content-Disposition: attachment;filename="products-export.xls"');
					header('Cache-Control: max-age=0');
					// If you're serving to IE 9, then the following may be needed
					header('Cache-Control: max-age=1');
					// If you're serving to IE over SSL, then the following may be needed
					header ('Expires: Mon, 26 Jul 1997 05:00:00 GMT'); // Date in the past
					header ('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT'); // always modified
					header ('Cache-Control: cache, must-revalidate'); // HTTP/1.1
					header ('Pragma: public'); // HTTP/1.0
					$objWriter = \PHPExcel_IOFactory::createWriter($excel, 'Excel5');
					$objWriter->setPreCalculateFormulas(TRUE);
					$objWriter->save('php://output'); 
		}


		public function importProduct(Request $request)
		{
			$data = [];


			$product_file = $request->file('product_file')->getRealPath();
			if ($request->hasFile('product_file'))
			{
				$inputFileType = \PHPExcel_IOFactory::identify($product_file);
				$objReader = \PHPExcel_IOFactory::createReader($inputFileType);
				$objPHPExcel = $objReader->load($product_file);
				$sheetNames = $objPHPExcel->getSheetNames();
						//  Get worksheet dimensions

				$sheet = $objPHPExcel->getSheet(0);
				$highestRow = $sheet->getHighestRow(); 
				$highestColumn = $sheet->getHighestColumn();

				$headingsArray = $sheet->rangeToArray('A2:'.$highestColumn.'2',null, true, true, true); 
				$headingsArray = $headingsArray[2];
				$headerData =  array_values($headingsArray);


				$r = -1;
				$namedDataArray = $config =array();
				for ($row = 3; $row <= $highestRow; ++$row) {
					$dataRow = $sheet->rangeToArray('A'.$row.':'.$highestColumn.$row,null, true, true, true);

					++$r;
					foreach($headingsArray as $columnKey => $columnHeading) {

					 if($columnHeading!='Config')
						$namedDataArray[$r][$columnHeading] = $dataRow[$row][$columnKey];
					else
						$config[]=$dataRow[$row][$columnKey];

				}
			}

			//get attribute types for product
			$attributeController = new AttributeController(); 
			$categoryData = [
					'categoryId' => $config[0],
					'filterableAttributes' => true,
					'secondaryAttributes' => true,
					];
			$attributeValueData = $attributeController->getCategoryAttributeValues($categoryData);  
			$attribArr = [] ;
			foreach($attributeValueData['result']['attributes'] as $attribute)
			{
				$attributeId = $attribute['id'];
				$attribArr[$attributeId] = $attribute;             
			}




						/****
						*  (ProductID ProductName ModelNumber Image mrp ,popularity Brand BrandID Group) = 9
						*
						// Attribute values not included
						***/
						$countFixedData = 9;
						$dataCount = count($namedDataArray[0]);
						$attributeIdKeys =[];
						
						$i=$countFixedData;
						while($i<$dataCount)
						{
							$attributeIdKeys[] =($i + 1);
							$i= $i+2;
						}

						$products = [];
						$i=0;

						$productArr = [];
						$priceRange = array();
						$insertedPrices=[];
						foreach($namedDataArray as $namedData)
						{

							if(!(is_null(max( $namedData)))){

								$indexedData = array_values($namedData); 


								$data = $namedData;

								$attributeIds = [];
								$text_attributes = [];

								$naAttribValue = in_array("#N/A", $indexedData,TRUE);

								if (($namedData["BrandID"] == "#N/A") || ($naAttribValue == 1) ) {

									continue;
								}
								else{
									foreach($attributeIdKeys as $key)
									{
										$attributeName = $headerData[$key]; 
										$dataKey = explode("(",$attributeName);
											$dataattributeId = explode(")",$dataKey[1]);
										$attributeId = $dataattributeId[0];// echo $attributeId; exit;
										
										if($attribArr[$attributeId]['type'] == "text"){
											$text_attributes[$attributeId] =  $indexedData[$key-1];
										}
										else{
												
											$attributeIds[$attributeId] = $indexedData[$key];
										}

									}


									$products[$i]['objectId'] = $data['ProductID'];
									$products[$i]['name'] = $data['ProductName'];
									$products[$i]['model_number'] = $data['ModelNumber'];
									$products[$i]['images'][] = ['src'=>$data['Image']];
									$products[$i]['attrs']= $attributeIds;
									$products[$i]['text_attributes']= $text_attributes;
									$products[$i]['mrp'] = $data['MRP'];
									$products[$i]['brandId'] = $data['BrandID'];
									$products[$i]['popularity'] = $data['Popularity'];
									$products[$i]['group'] = $data['Group'];   

									$insertedPrice = (int)$data['MRP'];
									
									$insertedPrices[]=$insertedPrice;
								}

							}



							$i++;
						}
							$priceRange[0]= min($insertedPrices);
							$priceRange[1]= max($insertedPrices);
							$productData['categoryId'] =$config[0];
							$productData['priceRange'] =$priceRange;
							$productData['products'] =$products;
							
							$this->parseProductImport($productData);

						}
						return redirect("/admin/attribute/categoryconfiguration");

					}

		public function getCategoryProducts($categoryId, $page, $displayLimit){

				$productQuery = new ParseQuery("ProductItem");
				
				$innerCategoryQuery = new ParseQuery("Category");
				$innerCategoryQuery->equalTo("objectId",$categoryId);

				# query to get products matching the child category
				$productQuery->matchesQuery("category", $innerCategoryQuery);

				$productQuery->includeKey("brand");
				$productQuery->includeKey("primaryAttributes");
				$productQuery->includeKey("primaryAttributes.attribute");
				$productQuery->includeKey("attrs");
				$productQuery->includeKey("attrs.attribute");

				# pagination
				$productQuery->limit($displayLimit);
				$productQuery->skip($page * $displayLimit);

				$results = $productQuery->find();

				$products = [];

				foreach ($results as $result) {
						$attrs = [];
						$attrs = $result->get("attrs");

					 
						$productAttributes  = [];

						foreach ($attrs as $attr) {
							 $productAttribute = array(
																		'attributeId' => $attr->get("attribute")->getObjectId() , 
																		'attributeName' => $attr->get("attribute")->get("name") , 
																		'attributeValueId' => $attr->getObjectId()  , 
																		'attributeValue' => $attr->get("value")
																		);

							 $productAttributes[] = $productAttribute;
						}

						$product = array(
												'objectId' => $result->getObjectId(), 
												'name' => $result->get("name"), 
												'brandId' => $result->get("brand")->getObjectId(), 
												'brandName' => $result->get("brand")->get("name"),
												'images' => $result->get("images"), 
												'model_number' => $result->get("model_number"), 
												'mrp' => $result->get("mrp"), 
												'popularity' => $result->get("popularity"),
												'attrs' => $productAttributes,
												'textAttributes' =>  $result->get("textAttributes"),
												'group' => $result->get("group")
												);
						$products[] = $product;
				 } 
			
				return $products;
		} 
		

		public static function parseProductImport($data){
 
			// $data = array (
			//   'categoryId' => 'vpEoQCuBoD',
			//   'products' => 
			//   array (
			//     0 => 
			//     array (
			//       'name' => 'Test product45',
			//       'model_number' => 'B00NKYN6NQ',
			//       'description' => '',
			//       'images' => 
			//       array (
			//         0 => 
			//         array (
			//           'src' => 'http://ecx.images-amazon.com/images/I/31hp6N9QLrL.jpg',
			//           ),
			//         ),
			//       'attrs' => 
			//       array (
			//         'bf7zmsjy0W' => 'aSUYZBgntN',
			//         'vvFjEY2AMn' => '2aUV0bSP3r',
			//         ),
			//       'mrp' => '9900',
			//       'brandId' => 'dYRPINT23g',
			//       'popularity' => 2,
			//       'group' => 'test product',
			//       ),
			//     ),
			//   );
				// dd(json_encode($data));
				$functionName = "productImport";

				$result = AttributeController::makeParseCurlRequest($functionName,$data,"jobs"); 

				return $result;
		}

		public function exportProductOnlinePrice( $catId ){

			$categoryProductPrice = $this->getCategoryProductPrice($catId);

			$excel = new PHPExcel(); 
			$excel->getProperties()
			->setCreator('Ajency')
			->setTitle('Product Price')
			->setLastModifiedBy('Ajency')
			->setDescription('Product price list')
			->setSubject('Price list')
			->setKeywords('product,price,list')
			->setCategory('Products');


			$priceSheet = $excel->getSheet(0);
			$priceSheet->setTitle('Price');


			$headers = array(
				array('productId','priceId','Name','Model Number','Price','Price Source'),
				array('productId','priceId','name','model_number','price','price_source'),
				);

			$priceSheet->fromArray($headers, ' ', 'A1');
			$priceSheet->fromArray($categoryProductPrice, ' ', 'A3');
			$priceSheet->getColumnDimension('A')->setVisible(false);
			$priceSheet->getColumnDimension('B')->setVisible(false);

			//Headr row height
				$priceSheet->getRowDimension('1')->setRowHeight(20);

				//freeze pan
				$priceSheet->getStyle('1:1')->getFont()->setBold(true);
				$priceSheet->freezePane('A2');

				//Hide second row
				$priceSheet->getRowDimension(2)->setVisible(false);

				//Format header row
				FormatPhpExcel::format_header_row($priceSheet, array(
					'background_color'=>'FFFF00',
					'border_color'=>'000000',
					'font_size'=>'9',
					'font_color'=>'000000',
					'vertical_alignment'=>'VERTICAL_CENTER',
					'font-weight'=>'bold'
					), '1'
				);

				FormatPhpExcel::formatSheet($priceSheet, 'Price', '');


			header('Content-Type: application/vnd.ms-excel');
			header('Content-Disposition: attachment;filename="Product_Price.xls"');
			header('Cache-Control: max-age=0');
			header('Cache-Control: max-age=1');
			header ('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
			header ('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT');
			header ('Cache-Control: cache, must-revalidate');
			header ('Pragma: public'); 
			$objWriter = \PHPExcel_IOFactory::createWriter($excel, 'Excel5');
			$objWriter->setPreCalculateFormulas(TRUE);
			$objWriter->save('php://output'); 
		} 






		public function getCategoryProductPrice($categoryId){
			// query products table to get all product ids that have given category id 
			// for each such product query the price class to get the latest price entry for that product 
			//  return array of product details + price for each

			$productQuery = new ParseQuery("ProductItem");
			
			$innerCategoryQuery = new ParseQuery("Category");
			$innerCategoryQuery->equalTo("objectId",$categoryId);

			# query to get products matching the child category
			$productQuery->matchesQuery("category", $innerCategoryQuery);

			// $productQuery->select("name" , "model_number" ) ;

			$parseProducts = $productQuery->find();

			$products = [];

			foreach ($parseProducts as $parseProduct) {
						
						$productId = $parseProduct->getObjectId();

						$onlinePrice = $this->getLatestProductPrice($productId);

						$product = array(
								'productId' => $parseProduct->getObjectId(), 
								'priceId' => $onlinePrice['id'],
								'name' => $parseProduct->get("name"),
								'model_number' => $parseProduct->get("model_number"),
								'price' => $onlinePrice['value'],
								'price_source' => $onlinePrice['source'],
								);
						$products[] = $product;
			}  

			//dd($products)    ;

			return $products;

		}


		public function getLatestProductPrice($productId, $price_type="online_market_price"){
			
			// query price class
			$priceQuery = new ParseQuery("Price");

			$innerProductQuery = new ParseQuery("ProductItem");
			$innerProductQuery->equalTo("objectId",$productId);    
			

			$priceQuery->matchesQuery("product",$innerProductQuery);
			
			$priceQuery->descending("createdAt");
			$priceQuery->equalTo("type", $price_type);    
			$priceQuery->descending("createdAt");    

			$priceResult = $priceQuery->first();


			if (!empty($priceResult)) {
			$price = array(
								'id' => $priceResult->getObjectId(), 
								'value' => $priceResult->get("value"), 
								'source' => $priceResult->get("source"), 
								);
			}
			else {
							$price = array(
								'id' => null, 
								'value' => null, 
								'source' => null 
								);
			}


			return $price;

		}

		public function importProductPrice(Request $request){
		
			$product_file = $request->file('product_price_file')->getRealPath();
			
			if ($request->hasFile('product_price_file'))
			{
				$inputFileType = \PHPExcel_IOFactory::identify($product_file);
				$objReader = \PHPExcel_IOFactory::createReader($inputFileType);
				$objPHPExcel = $objReader->load($product_file);
				$sheetNames = $objPHPExcel->getSheetNames();
				
				$sheet = $objPHPExcel->getSheet(0);
				$highestRow = $sheet->getHighestRow(); 
				$highestColumn = $sheet->getHighestColumn();

				$headingsArray = $sheet->rangeToArray('A2:'.$highestColumn.'2',null, true, true, true); 
				
				$headingsArray = $headingsArray[2];
				$headerData =  array_values($headingsArray);
			}


			$r = -1;
			
			$namedDataArray = $config =array();
			
			for ($row = 3; $row <= $highestRow; ++$row) {
				$dataRow = $sheet->rangeToArray('A'.$row.':'.$highestColumn.$row,null, true, true, true);

				++$r;
				foreach($headingsArray as $columnKey => $columnHeading) {

						$namedDataArray[$r][$columnHeading] = $dataRow[$row][$columnKey];

				}
			}

			$productPriceArr = [];
			foreach($namedDataArray as $namedData){
				
				if(!(is_null(max( $namedData )))){ 
					$productPriceArr[] = $namedData;
				}

			}

			$this->parseProductPriceImport($productPriceArr);

			return redirect("/admin/attribute/categoryconfiguration");

		}

		public function parseProductPriceImport($productPriceArr){

			$bulkPriceInstances = [];
			
			foreach ($productPriceArr as $product) {
				
				$productId = $product['productId'];
				$priceValue = $product['price'];
				$priceSource = $product['price_source'];
				
				if(is_null($priceValue)|| is_null($productId) || is_null($priceSource)){
					continue;
				}
				else{
					$priceInstance = new ParseObject("Price");

					if (!is_null($product['priceId'])){

						$query = new ParseQuery("Price");
						
						try {
						  $existingPriceObj = $query->get($product['priceId']);
						  // The object was retrieved successfully.

						  if ($existingPriceObj->get('source') != $priceSource) {
						  	$existingPriceObj->set('source', $priceSource);
						  	$existingPriceObj->set('value', $priceValue);
						  	$existingPriceObj->save();
						  }
						  else if($existingPriceObj->get('source') == $priceSource){
						  	if ($existingPriceObj->get('value') != $priceValue) {
						  		$existingPriceObj->set('value', $priceValue);
						  		$existingPriceObj->save();
						  	}
						  }
						} catch (ParseException $ex) {
						  // The object was not retrieved successfully.
						  // error is a ParseException with an error code and message.
						  echo 'Failed to update object, with error message: ' . $ex->getMessage();
						}

					}

					else{
						$productPointer = array('__type' => 'Pointer', 'className' => 'ProductItem', 'objectId' => $productId);
						$priceInstance->setAssociativeArray("product", $productPointer);

						$priceInstance->set("value", $priceValue);
						$priceInstance->set("source", $priceSource);
						$priceInstance->set("type", "online_market_price");

						$bulkPriceInstances[] = $priceInstance;
					}


				}
				
				try {
					ParseObject::saveAll($bulkPriceInstances);
				} catch (ParseException $ex) {  
				  // Execute any logic that should take place if the save fails.
				  // error is a ParseException object with an error code and message.
					echo 'Failed to create new object, with error message: ' . $ex->getMessage();
				}
                    
			}



		}
}