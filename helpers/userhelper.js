var db=require('../config/connection')
var collections=require('../config/collection')
var bcrypt=require('bcrypt')
var objectId=require('mongodb').ObjectId;
const { resolve } = require('promise');
const collection = require('../config/collection');
const Razorpay=require('razorpay');
const { options } = require('../routes/users');
var instance = new Razorpay({
    
        key_id: 'rzp_test_VT9O3apv7Xy3nK',
        key_secret: 'k7aTdzWV5B2zs3cYaKayGvyU'
        
      });
    
  

module.exports={
doSignup:(userData)=>{
    
    return new Promise(async(resolve,reject)=>{
        userData.Password=await bcrypt.hash(userData.Password,10)
            
        db.get().collection(collections.USER_COLLECTIONS).insertOne(userData).then((response)=>{
            resolve(userData)
             
        })
    })

},
 doLogin:(userData)=>{
     return new Promise(async(resolve,reject)=>{
    
     let loginStatus=false
     let response={}
     
     let user=await db.get().collection(collections.USER_COLLECTIONS).find({email:userData.Email}).toArray()
     
     if(user){
         bcrypt.compare(userData.Password,user[0].Password).then((status)=>{
           if(status){
               console.log("loggin sucess");
               response.user=user
               response.status=true
               resolve(response)
           }else{
               console.log("loggin failed");
               resolve({status:false})
           }
         })
     }else{
         console.log("loggin failed");
         resolve({status:false});
     }
 
})
 },
   getCarts:(proId,userId)=>{
       proObj={
           item:objectId(proId),
           quantity:1
       }
     return new Promise(async(resolve,reject)=>{
        let usercart=await db.get().collection(collections.CART_COLLECTIONS).findOne({user:objectId(userId)})
        if(usercart){
        let proEx=usercart.products.findIndex(products=> products.item==proId)
        console.log(proEx);
        if(proEx!=-1){
          db.get().collection(collections.CART_COLLECTIONS).updateOne({user:objectId(userId),'products.item':objectId(proId)},
          {
             $inc:{'products.$.quantity':1} 
          }
        
          )
        }else{
             db.get().collection(collections.CART_COLLECTIONS).updateOne({user:objectId(userId)},
             {
                 $push:{products:proObj}

             }
             ).then((response)=>{
                resolve()
             })
        }
         }else{
             let cartsObj={
                 user:objectId(userId),
                products:[proObj]
             }
             db.get().collection(collections.CART_COLLECTIONS).insertOne(cartsObj).then(()=>{
                resolve()
             })
            }
             
         })
     },
     getcartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collections.CART_COLLECTIONS).findOne({user:objectId(userId)})
            resolve(cart.products)
        })
     },
     getOrderdetails:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderdetails=await db.get().collection(collections.ORDER_COLLECTIONS).find({user:objectId(userId)}).toArray()
            console.log(orderdetails);
            resolve(orderdetails)
        })
     },
       verifyPayment:(details)=>{
           return new Promise((resolve,reject)=>{
               let crypto=require('crypto')
               let hmac=crypto.createHmac('sha256','k7aTdzWV5B2zs3cYaKayGvyU')
               hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
               hmac=hmac.digest('hex')
               if(hmac===details['payment[razorpay_signature]']){
                   resolve()
               }else{
                   reject()
               }
           })
       },
        changeOrderStatus:(orderId)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collections.ORDER_COLLECTIONS).updateOne({_id:objectId(orderId)},
                {
                    $set:{
                        status:"placed"
                    }
                }
                ).then(()=>{
                    resolve()
                })
            })
        },
     placeOrder:(order,products,total)=>{
         console.log(order,products,total);
         
         return new Promise(async(resolve,reject)=>{
         let status=order['paymentmethod']==='COD'?'placed':'pending'
         
          
         
     db.get().collection(collections.ORDER_COLLECTIONS).insertMany([{user:objectId(order.userId),adddress:order.address,
        pincode:order.pincode,
        mobile:order.mobile,
            paymentmethod:order['paymentmethod'],
            products:products,
            total:total,
            status:status,
            Date:new Date()}])
    
                      

               let orderId=await db.get().collection(collections.ORDER_COLLECTIONS).find().toArray()
            
                        console.log(orderId)
                        resolve(orderId[0]._id)
                  })
         
        
        
     },
       getRazorder:(orderId,total)=>{
           return new Promise((resolve,reject)=>{
               var options={
                   amount:total*100,
                   currency:"INR",
                   receipt:""+orderId

               };
            
               instance.orders.create(options,function(err,order){
                   if(err){
                       console.log("errors",err)
                   }else{
                   console.log('orders',order)
                   resolve(order)
                   }
               })
               
           })
       },
      getorderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
              
            
            let products=await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_HELPERS,
                        localField:"item",
                        foreignField:"_id",
                        as:'product'
                    }
                },
                {
                 $project:{
                     
                      item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                 }
                }
                ]).toArray()
                console.log(products)
               resolve(products)
         })
       },

      
      getTotal:(userId)=>{
        
                
                    
            return new Promise(async(resolve,reject)=>{
              
            
            let total=await db.get().collection(collections.CART_COLLECTIONS).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_HELPERS,
                        localField:"item",
                        foreignField:"_id",
                        as:'product'
                    }
                },
                {
                 $project:{
                     
                      item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                 }
              },
              {
                  $group:{
                      _id:null,
                      total:{$sum:{$multiply:['$quantity','$product.Price']}}
                  }
              }
                        // let:{prodetails:"$products"},
                         //pipeline:[
                             //{
                               // $match:{
                                   // $expr:{
                                      //  $in:['$_id',"$$prodetails"]
                                   // }
                               // }
                             //}
                        // ],
                          //as:'cartItem'


                         
                    // }
                 //
               
                
            ]).toArray()    
            console.log(total[0].total)
            resolve(total[0].total)
        })
      },
      changeProducts:(details)=>{
    
          
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
                   
          return new Promise(async(resolve,reject)=>{
              if (details.count==-1 && details.quantity==1){
                db.get().collection(collections.CART_COLLECTIONS).updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.proId)}}
                }    
                ).then((response)=>{
                    resolve({removeproduct:true})
                })
            }else{
          
         
        db.get().collection(collections.CART_COLLECTIONS).updateOne({_id:objectId(details.cart),'products.item':objectId(details.proId)},
          {
             $inc:{'products.$.quantity':details.count} 
          }
        
          ).then((response)=>{
            resolve({status:true})
          })
        } 
    })
            
        
    
        
     
        
      },
       removeProducts:(details)=>{
           return new Promise((resolve,reject)=>{
          db.get().collection(collections.CART_COLLECTIONS).updateOne({_id:objectId(details.cart)},
          {
              $pull:{products:{item:objectId(details.proId)}}
          }
       ).then((response)=>{
           resolve({removeproduct:true})
       })
    })

       },
      getAllcarts:(userId)=>{
          
          return new Promise(async(resolve,reject)=>{
              
            
              let cartItems=await db.get().collection(collections.CART_COLLECTIONS).aggregate([
                  {
                      $match:{user:objectId(userId)}
                  },
                  {
                      $unwind:'$products'
                  },
                  {
                      $project:{
                          item:'$products.item',
                          quantity:'$products.quantity'
                      }
                  },
                  {
                      $lookup:{
                          from:collections.PRODUCT_HELPERS,
                          localField:"item",
                          foreignField:"_id",
                          as:'product'
                      }
                  },
                  {
                   $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                   }
                }
                   //{
                      // $lookup:{
                        //   from:collections.PRODUCT_HELPERS,
                          // let:{prodetails:"$products"},
                           //pipeline:[
                               //{
                                 // $match:{
                                     // $expr:{
                                        //  $in:['$_id',"$$prodetails"]
                                     // }
                                 // }
                               //}
                          // ],
                            //as:'cartItem'


                           
                      // }
                   //}
              ]).toArray()
                 console.log(cartItems)
                resolve(cartItems)

          })
      }
    }
    
   
       

     
