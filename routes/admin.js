const { response } = require('express');
var express = require('express');
const producthelpers = require('../helpers/producthelpers');
const userhelper=require('../helpers/userhelper');
var router=express.Router();

let verifylogs=(req,res,next)=>{
  if(req.session.admin){
       next()
  }else{
    res.render('admin/login')
  }
}


router.get('/', function(req,res,next){
  let ad=req.session.admin
  console.log(ad)
    
    producthelpers.getAllProducts().then((products)=>{
      
      res.render('admin/viewadmin',{admin:true,products,ad});
    })
  })
  router.get('/userslogin',(req,res)=>{
    console.log(req.session.admin)
     let user=req.session.user
     
     
   res.render('admin/userdetails',{user})
        
   });
      
 

router.get('/orderproducts/:id',async(req,res)=>{
  let products=await userhelper.getorderProducts(req.params.id)
  res.render('admin/orderproducts',{user:req.session.user,products})
})


router.post('/signup',(req,res)=>{
  console.log(req.body)
  producthelpers.doSignup(req.body).then((response)=>{
   
   req.session.admin=response
   req.session.admin.loggedIn=true
     console.log(req.session.admin);
  })

 
  });
  router.get('/signup',function(req,res){
    res.render("admin/signup")
  });
router.get('/login',function(req,res){
  if(req.session.admin){

    console.log(req.session.admin)
    res.redirect("/admin")
  }else{
    
    res.render("admin/login",{"loginErr":req.session.adminLoginErr})
    req.session.adminLoginErr=false
    
  }
  
});
router.get('/logout',function(req,res){
  req.session.admin=null
  
  res.redirect("/admin")
});
router.post('/login',(req,res)=>{
  producthelpers.doLogin(req.body).then((response)=>{
      if(response.status){
       req.session.admin=response.admin
        req.session.admin.loggedIn=true
        
        res.redirect('/admin')
      }else{
       req.session.adminLoginErr="invalid username or password"
        res.render('admin/login')
      }
  })
 });
  router.get('/delete-product/:id',(req,res)=>{
    let proId=req.params.id
    producthelpers.deleteproduct(proId).then((response)=>{
      console.log(response)
      res.redirect('/admin')
    })
    
  });
 router.get('/addproduct',verifylogs,(req,res)=>{
    
   res.render('admin/addproduct')
     
 });
 router.post('/addproduct',verifylogs,(req,res)=>{
req.body.Price=parseInt(req.body.Price)
   
   producthelpers.addproducts(req.body,(id)=>{
    
     let image=req.files.images
     
     image.mv('./public/productimages/'+id+".jpg",(error)=>{
        if(!error){
          res.render("admin/addproduct")
        }else{
          console.log(error);
        }
     })
   })
  });
    router.get('/editproducts/:id',async(req,res)=>{
      let proId=req.params.id
     let products=await producthelpers.getProducts(proId)
      console.log(products);
      res.render('admin/editproducts',{products})
    });
    router.post('/editproducts/:id',(req,res)=>{
       producthelpers.updateOne(req.params.id,req.body).then(()=>{
          res.redirect('/admin')
          if(req.files.images){
          let id=req.params.id
          let image=req.files.images
     
     image.mv('./public/productimages/'+id+".jpg")
          }
       })
    })
  


   
   
   




   
       
   
   

   

  
   





module.exports=router;