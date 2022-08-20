const { response } = require('express');
var express = require('express');
const { OrderedBulkOperation } = require('mongodb');
var router=express.Router();
const producthelpers = require('../helpers/producthelpers');
const userhelper=require('../helpers/userhelper');

let vary=(req,res,next)=>{
  if(req.session.user){
      next()
  }else{
    res.redirect("/login")
  }
}

/* GET home page. */
router.get('/',vary ,function(req, res) {
  
  var us=req.session.user[0].name
  
  

  producthelpers.getAllProducts().then((products)=>{
    
    res.render('user/viewuser',{admin:false,products, us});
  })
});
router.get('/login',function(req,res){
  if(req.session.user){
            
     res.redirect("/")
  }else{
    
    res.render("user/login",{"loginErr":req.session.userLoginErr})
    req.session.userLoginErr=false
  }
  
});
router.get('/placeorder',vary,async(req,res)=>{
  let total=await userhelper.getTotal(req.session.user[0]._id)
  var user=req.session.user[0]._id
  res.render('user/placeorder',{total,user:req.session.user[0]._id})
  console.log(user)
});
router.post('/verifypayment',(req,res)=>{
  console.log(req.body);
  userhelper.verifyPayment(req.body).then((response)=>{
    console.log("payment successfull");
    userhelper.changeOrderStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })

  }).catch((err)=>{
     res.json({status:false})
  })
});
router.post('/placeorder',async(req,res)=>{
  console.log(req.body);

  

 let  products=await userhelper.getcartProducts(req.body.userId)
 let total=await userhelper.getTotal(req.body.userId)
   let orderId=await userhelper.placeOrder(req.body,products,total)

   
      
      if(req.body['paymentmethod']==='COD'){
      
       res.json({CODSuccess:true})
      }else{
        userhelper.getRazorder(orderId,total).then((response)=>{
              res.json(response)
        })
      }
    
    
});

   router.get('/profile',vary,(req,res)=>{
    let user=req.session.user
     res.render('user/profile',{user})
   });
 router.get('/orders',vary,(req,res)=>{
  
     res.render('user/orders',{user:req.session.user})
 });
 router.get('/orderdetails',vary,async(req,res)=>{
      let orderdetails=await userhelper.getOrderdetails(req.session.user[0]._id)
      res.render('user/orderdetails',{user:req.session.user[0]._id,orderdetails})
 });
  router.get('/orderproducts/:id',async(req,res)=>{
      let products=await userhelper.getorderProducts(req.params.id)
      res.render('user/orderproducts',{user:req.session.user,products})
  })
router.get('/logout',function(req,res){
  
  req.session.user=null
  
  req.session.userLoggedIn=false
  res.redirect("/")
});
router.get('/signup',function(req,res){
  res.render("user/signup")
});
router.get('/cart',vary,async(req,res)=>{
  console.log(req.session.user[0]._id)
  
 let products=await userhelper.getAllcarts(req.session.user[0]._id)
 let total=await userhelper.getTotal(req.session.user[0]._id)
 let user=req.session.user[0]._id
  console.log(products)
  console.log(user)
  console.log(total)
  
  res.render("user/cart",{products,user,total})
});
router.post('/change-product',(req,res)=>{
  
  
    userhelper.changeProducts(req.body).then(async(response)=>{
       response.total=await userhelper.getTotal(req.body.user)
       console.log(response);
       
       res.json(response)
    })
  
});
router.post('/removeProduct',(req,res)=>{
  userhelper.removeProducts(req.body).then((response)=>{
    res.json(response)
  })
});
 router.post('/signup',(req,res)=>{
   
   userhelper.doSignup(req.body).then((response)=>{
    
    req.session.user=response
    req.session.user.loggedIn=true
      console.log(response);
      res.render('user/login')
   })

  
   });
   router.get('/orderdetails',vary,async(req,res)=>{
    let orderdetails=await userhelper.getOrderdetails(req.session.user[0]._id)
    console.log(req.session.user[0]._id)
    res.render('user/orderdetails',{orderdetails})
   });
   router.post('/login',(req,res)=>{
     userhelper.doLogin(req.body).then((response)=>{
         if(response.status){
      
          req.session.user=response.user
          req.session.user.loggedIn=true
      
        
           res.redirect('/')
         }else{
          req.session.userLoginErr="invalid username or password"
           res.redirect('/login')
         }
     })
    });
     router.get('/add-cart/:id',vary,(req,res)=>{
       userhelper.getCarts(req.params.id,req.session.user[0]._id).then(()=>{
    
       
         res.json({status:true})
         
         
      
       })
       
      
       
     })
  

module.exports = router;
  
  
  
   


