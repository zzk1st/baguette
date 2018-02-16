# Baguette

Baguette is an extremely light-weighted scripting language for conversation-based javascript game development.

## Getting Started

### Installing

install npm

```
sudo apt-get install npm
```

then install baguette

```
npm install -g baguette
```

### hello world

Baguette contains two things: a compiler and a virtual machine.

#### compiler

Suppose we have a piece of baguette code like below:

```
function helloworld()
{
  a = 1+ 2 * 3;
  print("Hello World!");
  print("a="+a);
  return a;
}
```

We save it in helloworld.bag. Then we use the compiler - bcc, to compile it to baguette's inermediate code (.bic):

```
bcc helloworld.bag -o helloworld.bic
```

#### virtual machine

Baguette's virtual machine is baguette-vm.js. You can use it in any of your javascript project.

Let's run our code with node.js.

Create an npm project, and copy baguette-vm.js into the folder

```
mkdir baguette-helloworld
cd baguette-helloworld
npm init
cp {baguette-vm.js directory} .
```

Create a helloworld.js like below:

```
var fs = require('fs');
var BaguetteVM = require('.baguette-vm').BaguetteVM;

let gameStats = {
  a: 1,
  b: 2,
  c: 3,
};

let gameFuncs = {
  print: {
    pauseAfterComplete: false,
    funcImp: (text) => console.log(text),
  }
};

let content = fs.readFileSync('helloworld.bic', 'utf8');
let baguetteVM = new BaguetteVM(content, gameStats, gameFuncs);
let result = baguetteVM.runFunc('helloworld');
```

Basically, to run a baguette virtual machine, you need three things - the code (.bic file), the environment variavbles, and the environment functions.

Environment variables are defined before running the vm. Because baguette cannot define local or global variables (yet), any variable used in the code must be defined as environment variables. This is also the way the vm interact with its host.

Environment functions are also functions defined in the host. They usually contains UI functions. Among all properties of a function, pauseAfterComplete means the vm stops after this function call. User must call vm.continue() to continue running the bic code. This is used in UI functions like showText, print, etc.

Finally, run the project:

```
node helloworld.js
```

And you get the output:
```
Hello World!
a=7
```

## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc

