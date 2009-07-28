Base64 = org.apache.commons.codec.binary.Base64;

AMQP = require('AMQP.js');
amqp = new AMQP({host:'cercus.cns.montana.edu'});
exch = amqp.topic({name:'mein'});
queue = amqp.queue("imageRender");
queue.bind({exchange:'mein', key:'render'});

// incomingQueue = amqp.queue("image");
// queue.bind({exchange:'mein', key:'image'});
// imageConsumer = incomingQueue.consumer({ack:true});
// 
// worker = new Thread(function(){
//     while(true) {
//         var delivery = null;
//         try {
//             delivery = imageConsumer.nextDelivery();
//             console.log(serialize(delivery));
//         }
//         catch(err) {
//             continue;
//         }
//         
//         if(delivery){
//             //Retrive the message with new image
//             /*
//              * msg = { target: "CercalCellAfferent/4",
//                        targetProperty: "snapshot",
//                        image: {
//                            contentType: "image/png",
//                            content: "...base64 encoded..."
//                        }
//                      }
//             */
//             
//             // try {
//                 var json = (new java.lang.String(delivery.getBody())).toString();
//                 var msg = JSON.parse(json);
//                 //Process the base64 encoded image
//                 var imageBytes = msg.image.content; // get the base64 encoded text
//                 imageBytes = (new java.lang.String(image)).getBytes(); //Convert to java string and conver to binary
//                 imageBytes = Base64.decodeBase64(image); //decode base64
//             
//                 var imageDef = {
//                     contentType: msg.image.contentType || "image/png",
//                     content: (new org.Persvr.data.BinaryData(imageBytes))
//                 }; 
//                 
//                 console.log(serialize(imageDef));
//             
//                 var record = load(msg.target);
//                 record[msg.targetProperty] = new File(imageDef);
//                 commit();
//                 console.log("Saved Image to " + record.id);
//                 incomingQueue.ack(delivery);
//             // }
//             //             catch(e) {
//             //                 continue;
//             //             }
//         }
//     }
// });

function renderImage(id, value){
    var hostname = java.net.InetAddress.getLocalHost().getHostName();
    var port = java.lang.System.getProperty('persevere.port');
    var url = "http://" + hostname + ":" + port;
    exch.publish({  key:'render', 
                    body: JSON.stringify({
                        id: id,
                        server: url, 
                        datafile: value
                    })
                });
}

Class({
    id: "CercalCellAfferent",
    regenerateAllSnapshots: function() {
        console.log("Regenerating all snapshots...");
        var cells = load('CercalCellAfferent/');
        for(var i=0; i<cells.length; i++){
            renderImage(cells[i].id, cells[i].datafile);
        }
    },
    properties: {
        datafile: {
            optional: true,
            type: File,
            onSet: function(value) {
                console.log(this.id);
                console.log("datafile prop set!");
                //console.log(JSON.stringify(value));
                renderImage(this.id, value);
                return value;
            }
            
        }
    },
    prototype: {
        onSave: function(){
            console.log("CercalCellAfferent Saved!");
            console.log("Arguments.length = " + arguments.length);
            for(var i=0; i < arguments.length; i++){
                console.log("Arg "+i+": " + arguments[i]);
            }

        }
    }
});