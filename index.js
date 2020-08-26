const express = require("express") 
const path = require("path") 
const multer = require("multer") 
const app = express() 
const formidable = require('formidable');
const {Storage} = require('@google-cloud/storage');

    
// View Engine Setup 
app.set("views",path.join(__dirname,"views")) 
app.set("view engine","ejs") 
    
// var upload = multer({ dest: "Upload_folder_name" }) 
// If you do not want to use diskStorage then uncomment it 
    
var storage = multer.diskStorage({ 
    destination: function (req, file, cb) { 
  
        // Uploads is the Upload_folder_name 
        cb(null, "/uploads") 
    }, 
    filename: function (req, file, cb) { 
      cb(null, file.fieldname + "-" + Date.now()+".jpg") 
    } 
  }) 
       
// Define the maximum size for uploading 
// picture i.e. 1 MB. it is optional 
const maxSize = 1 * 1000 * 1000; 
    
var upload = multer({  
    storage: storage, 
    limits: { fileSize: maxSize }, 
    fileFilter: function (req, file, cb){ 
    
        // Set the filetypes, it is optional 
        var filetypes = /jpeg|jpg|png/; 
        var mimetype = filetypes.test(file.mimetype); 
  
        var extname = filetypes.test(path.extname( 
                    file.originalname).toLowerCase()); 
        
        console.log(extname)
        if (mimetype && extname) { 
            return cb(null, true); 
        } 
      
        cb("Error: File upload only supports the "
                + "following filetypes - " + filetypes); 
      }  
  
// mypic is the name of file attribute 
}).single("mypic");        
  
app.get("/",function(req,res){ 
    app.use(express.static(path.join(__dirname,'css')));
    app.use('/images', express.static(path.join(__dirname,'images')));
    app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
    app.use('/cloud_uploads', express.static(path.join(__dirname, '/cloud_uploads')));
    //app.use('/html',(req,res,next)=>{
        res.sendFile(path.join(__dirname,'html','index.html'));
    //});
});

app.get("/product",function(req,res){ 
    app.use(express.static(path.join(__dirname,'css')));
    app.use(express.static(path.join(__dirname,'js')));
    app.use('/images2', express.static(path.join(__dirname,'images2')));
    app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
    app.use('/cloud_uploads', express.static(path.join(__dirname, '/cloud_uploads')));
        res.sendFile(path.join(__dirname,'html','detail_product.html'));
});

app.post("/uploadProfilePicture",function (req, res, next) {  

    var form = new formidable.IncomingForm();

    form.parse(req);

    form.on('fileBegin', function (name, file){
        file.path = __dirname + '/uploads/' + file.name;
    });

    form.on('file', function (name, file){
        console.log('Uploaded ' + file.name);
        const bucketName = 'drink_eliqs'; //doesn't allow duplication of files
    const filename = file.path.toString();
    const storage = new Storage();

    async function uploadFile() {
        // Uploads a local file to the bucket
        await storage.bucket(bucketName).upload(filename, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
        },
        });
        
        console.log(`${filename} uploaded to ${bucketName}.`);
        downloadFile().catch(console.error);
    }

    const srcFilename = file.name;
    const destFilename = __dirname + '/cloud_uploads/' + srcFilename;

    async function downloadFile() {
        console.log("entered download");
        const options = {
          // The path to which the file should be downloaded, e.g. "./file.txt"
          destination: destFilename,
        };
      
        // Downloads the file
        await storage.bucket(bucketName).file(srcFilename).download(options);
      
        console.log(
          `gs://${bucketName}/${srcFilename} downloaded to ${destFilename}.`
        );
        console.log("sent status");
        res.sendStatus(200);
        res.status(200);
      }
      
    uploadFile().catch(console.error);
    });
}) 
    
// Take any port number of your choice which 
// is not taken by any other process 
// app.listen(3000,function(error) { 
//     if(error) throw error 
//         console.log("Server created Successfully on PORT 3000") 
// }) 

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Hello world listening on port', port);
});

//for gcp change the port and the urls from localhost
//to do: change upload names to be unique, handle multiple users