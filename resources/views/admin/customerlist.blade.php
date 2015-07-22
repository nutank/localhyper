@extends('layouts.master') 
@section('content')
<div class="content">  
       <button type="button" class="btn btn-default btn-cons pull-right"><i class="fa fa-download"></i> Download CSV</button>
		<div class="page-title m-l-5">	
			<h3 class="inline"><span class="semi-bold">Customers</span> List</h3>
		</div>
		<div class="grid simple vertical purple">
      
			<h4 class="grid-title">List Of Customers</h4>
			<div class="grid-body">
         <table class="table table-bordered customerList">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Customer Registered Date</th>
              
            </tr>
          </thead>
          <tbody>
           @foreach($customers as $customer)
              <tr>
                <td>{{ $customer['name'] }}</td>
                <td>{{ $customer['createdAt'] }}</td>
              </tr>
           @endforeach
          </tbody>
         </table>
                        </div>
		</div>
    </div>

<script type="text/javascript">
   /* $( document ).ready(function() {
         var str='';
        var customerList = getCustomers().then(function(results) {
                            _.each(results, function(customer) {
  //return console.log(customer.get("displayName"));
                                 str = '<tr>';
                                  str += '<td>'+customer.get("displayName")+'</td>'; 
                                  str += '<td>23-04-2014</td>';  
                                  str += '</tr>';    
                                  $('.customerList tbody').append(str);
});
                             //console.log(results);
                          }, function(error) {
                            return error;
                          });
       
       
       /* $.each(customerList, function( index, user ) { //alert(index);
          str = '<tr>';
          str += '<td></td>'; 
          str += '<td>23-04-2014</td>';  
          str += '</tr>';    
          $('.customerList tbody').append(str);
        });
    });*/
</script> 
@endsection