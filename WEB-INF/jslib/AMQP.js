client = com.rabbitmq.client;

function Exchange(options) {
    var channel = options.channel;
    var name = options.name;
    var type = options['type'] || 'direct';
    var durable = !!options.durable || false;
    channel.exchangeDeclare(name, type, durable);
    
    return {
        publish: function(options){
            var key = options['key'];
            var body = (new java.lang.String((options['body'] || ""))).getBytes()
            channel.basicPublish(name, key, null, body);
        },
        get name() { return name; },
        get type() { return type; },
        get durable() { return durable; }
    }
};

function Queue(options) {
    var channel = options.channel;
    var name = options.name;
    channel.queueDeclare(name);
    
    return {
        get name() { return name; },
        bind: function(options) {
            var exchange = options['exchange'];
            var key = options['key'];
            channel.queueBind(name, exchange, key);
        }
    }
};

function AMQP(options) {
    var params = new client.ConnectionParameters();
    params.setUsername(options['userName'] || 'guest');
    params.setPassword(options['password'] || 'guest');
    params.setVirtualHost(options['virtualHost'] || "/");
    params.setRequestedHeartbeat(options['requestedHeartbeat'] || 0);
    
    var factory = new client.ConnectionFactory(params);
    var conn = factory.newConnection(
        options['host'] || 'localhost',
        options['port'] ||  5672
        );
    var channel = conn.createChannel();
    
    return {
        close: function() { channel.close(); conn.close(); },
        host: function() { return conn.getHost(); },
        port: function() { return conn.getPort(); },
        exchange: function(options) {
            options.channel = channel;
            return new Exchange(options);
        },
        direct: function(options) {
            options['type'] = 'direct';
            return this.exchange(options);
        },
        topic: function(options) {
            options['type'] = 'topic';
            return this.exchange(options);
        },
        queue: function(name){
            return new Queue({channel: channel, name: name});
        },
        bind: function(options){
            var queue = options.queue instanceof Queue ? options.queue.name : options.queue ;
            var exchange = options.exchange instanceof Exchange ? option.exchange.name : options.exchange;
            var key = options.key;
            channel.queueBind(queue, exchange, key);
        },
        publish: function(options){
            var exchange = options['exchange'];
            var key = options['key'];
            var body = (new java.lang.String((options['body'] || ""))).getBytes()
            channel.basicPublish(exchange, key, null, body);
        }
    }
};

exports = AMQP;