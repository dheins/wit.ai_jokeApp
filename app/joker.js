
var http = require('http');
let Wit = null;
let interactive = null;
try {
  // if running from repo
  Wit = require('../lib').Wit;
  interactive = require('../').interactive;
} catch (e) {
  Wit = require('node-wit').Wit
  interactive = require('node-wit').interactive;
}

const accessToken = (() => {
  if (process.argv.length !== 3) {
    console.log('usage: node examples/joke.js <wit-access-token>');
    process.exit(1);
  }
  return process.argv[2];
})();

////////////////////////////////////////////////

var categories = [{name:"chuck norris",options:{hostname: 'api.icndb.com',path: '/jokes/random'}, parse:function(obj){ return obj.value.joke}},
				{name:"yo mamma", options:{hostname: 'api.yomomma.info', path:'/'}, parse:function(obj){ return obj.joke}}];

function getCategory(category){
	var cat = category.trim();
	var len = categories.length
	for(i=0; i< len; i++){
		var obj = categories[i].name;
		if(obj == cat){
			return categories[i];
		}
			
	}
	return null;
}
function getRandom(){
	return categories[Math.floor(Math.random() * categories.length)]
}
///////////////////////////////////////////////

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  send(request, response) {
    console.log('sending...', JSON.stringify(response));
    return Promise.resolve();
  },
  getCategories({context, entities}) {
	  var resp = ''
	  if(categories.length == 1){
		  resp += categories[0].name;
	  }else if(categories.length == 2){
		  resp += categories[0].name + " and " + categories[1].name;
	  }else{
		  var len = categories.length
		  for(i=0; i<len-1; i++){
			  resp += categories[i].name + ", "
		  }
		  resp += "and " + categories[len-1];
	  }
	  context.categories = resp;
	  return context;

  },
  getResponse({context, entities}) {
	  var response = firstEntityValue(entities, 'sentiment');
	  console.log(response)
	  if(response == 'positive'){
		  context.response = "Thanks!"
	  }else{
		  context.response = "I'm doing the best I can!"
	  }
	  
	  return context
  },
  getJoke({context, entities}) {
	  //console.log("Getting a joke")

	var category = firstEntityValue(entities, 'local_search_query');
	//console.log(category)
	var cat = category;
	if(category == 'joke'){
		cat = getRandom();
		//console.log("Random ->" + cat)
	}else{
		cat = getCategory(category);
	}
	
	if(cat != null){
		return new Promise(function(resolve, reject) {
			var options = cat.options;
			var req = http.get(options, function(response){
					var str = ''
					
					//console.log("Status code -> " + response.statusCode);
					response.on('data',function(chunk){
						str+= chunk;
					});
					response.on('end', function(){
						var obj = JSON.parse(str);
						var joke = cat.parse(obj);
						//console.log("Joke to return ->" + joke)
						context.joke = joke;
						return resolve(context);
					});
					
				
			});
			
			req.end();
			req.on('error', function(e){
				console.log(e);
				context.joke = "Im not feeling funny today"
				return resolve(context);
			});  
			  
		});
	}else{
		context.joke = "Hmm, I don't know any jokes like that"
		return context;
	}
    
	
	},
};

const client = new Wit({accessToken, actions});
interactive(client);
