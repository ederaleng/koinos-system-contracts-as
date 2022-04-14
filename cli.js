/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { program } = require('commander');
const { execSync } = require('child_process');
const packageJson = require('./package.json');

let ASProtoGenPath;
let koinoABIGenPath;
let koinosASGenPath;

let isWin = false;

switch (process.platform) {
  case 'win32':
    isWin = true;
    ASProtoGenPath = '.\\node_modules\\.bin\\as-proto-gen.cmd';
    koinoABIGenPath = '.\\node_modules\\.bin\\koinos-abi-proto-gen.cmd';
    koinosASGenPath = '.\\node_modules\\.bin\\koinos-as-gen.cmd';
    break;
  default:
    ASProtoGenPath = './node_modules/.bin/as-proto-gen';
    koinoABIGenPath = './node_modules/.bin/koinos-abi-proto-gen';
    koinosASGenPath = './node_modules/.bin/koinos-as-gen';
    break;
}

program
  .name('Koinos AssemblyScript Smart Contracts CLI')
  .description('CLI to build Koinos AssemblyScript Smart Contracts')
  .version(packageJson.version);

program.command('build-all')
  .description('Build all Smart Contract files')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .argument('<buildMode>', 'Build mode debug or realease')
  .argument('<protoFileNames...>', 'Name of the contract proto files')
  .option('--generate_authorize', 'generate the authorize entry point')
  .action((contractFolderPath, buildMode, protoFileNames, options) => {
    const generateAuthEndpoint = options.generate_authorize ? isWin ? 'set GENERATE_AUTHORIZE_ENTRY_POINT=1&&' : 'GENERATE_AUTHORIZE_ENTRY_POINT=1 ' : '';

    // to make it easier for dapps devs, the first proto filename is considered to be the contract proto file
    // that's the only one for which we auto populate the contract path
    // the rest must have the full path to the proto files
    protoFileNames[0] = `${contractFolderPath}/assembly/proto/${protoFileNames[0]}`;

    // compile proto file
    console.log('Generating ABI file...');
    let cmd = `yarn protoc --plugin=protoc-gen-abi=${koinoABIGenPath} --abi_out=${contractFolderPath}/abi/ ${protoFileNames.join(' ')}`;
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit' });

    console.log('Generating proto files...');
    cmd = `yarn protoc --plugin=protoc-gen-as=${ASProtoGenPath} --as_out=. ${contractFolderPath}/assembly/proto/*.proto`;
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit' });

    // Generate CONTRACT.boilerplate.ts and index.ts files
    console.log('Generating boilerplate.ts and index.ts files...');
    cmd = `${generateAuthEndpoint}yarn protoc --plugin=protoc-gen-as=${koinosASGenPath} --as_out=${contractFolderPath}/assembly/ ${protoFileNames[0]}`;
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit' });

    // compile index.ts
    console.log('Compiling index.ts...');
    cmd = `node ./node_modules/assemblyscript/bin/asc ${contractFolderPath}/assembly/index.ts --target ${buildMode} --use abort= --config ${contractFolderPath}/asconfig.json`;
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit' });
  });

program.command('build')
  .description('Build index.ts file')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .argument('<buildMode>', 'Build mode debug or realease')
  .action((contractFolderPath, buildMode) => {
    // compile index.ts
    console.log('Compiling index.ts...');
    const cmd = `node ./node_modules/assemblyscript/bin/asc ${contractFolderPath}/assembly/index.ts --target ${buildMode} --use abort= --config ${contractFolderPath}/asconfig.json`;
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit' });
  });

program.command('generate-abi')
  .description('Generate ABI files')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .argument('<protoFileNames...>', 'Name of the contract proto files')
  .action((contractFolderPath, protoFileNames) => {
    // to make it easier for dapps devs, the first proto filename is considered to be the contract proto file
    // that's the only one for which we auto populate the contract path
    // the rest must have the full path to the proto files
    protoFileNames[0] = `${contractFolderPath}/assembly/proto/${protoFileNames[0]}`;
    
    // compile proto file
    console.log('Generating ABI file...');
    const cmd = `yarn protoc --plugin=protoc-gen-abi=${koinoABIGenPath} --abi_out=${contractFolderPath}/abi/ ${protoFileNames.join(' ')}`;
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit' });
  });

program.command('generate-contract-as')
  .description('Generate contract.boilerplate.ts and index.ts files')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .argument('<protoFileName>', 'Name of the contract proto file')
  .argument('<additionalProtoFileNames...>', 'Name of the additional proto files')
  .option('--generate_authorize', 'generate the authorize entry point')
  .action((contractFolderPath, protoFileName, additionalProtoFileNames, options) => {
    const generateAuthEndpoint = options.generate_authorize ? isWin ? 'set GENERATE_AUTHORIZE_ENTRY_POINT=1&&' : 'GENERATE_AUTHORIZE_ENTRY_POINT=1 ' : '';


    // Generate CONTRACT.boilerplate.ts and index.ts files
    console.log('Generating boilerplate.ts and index.ts files...');
    const cmd = `${generateAuthEndpoint}yarn protoc --plugin=protoc-gen-as=${koinosASGenPath} --as_out=${contractFolderPath}/assembly/ ${contractFolderPath}/assembly/proto/${protoFileName} ${additionalProtoFileNames.join(' ')}`;
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit' });
  });

program.command('generate-contract-proto')
  .description('Generate AS files for the contract proto files')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .argument('<additionalProtoFileNames...>', 'Name of the additional proto files')
  .action((contractFolderPath, additionalProtoFileNames) => {
    // compile proto file
    console.log('Generating Contract AS proto files...');
    const cmd =`yarn protoc --plugin=protoc-gen-as=${ASProtoGenPath} --as_out=. ${contractFolderPath}/assembly/proto/*.proto ${additionalProtoFileNames.join(' ')}`;
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit' });
  });

program.command('generate-as-proto')
  .description('Generate AS files for the given proto files')
  .argument('<protoFileNames...>', 'Name of the proto files to compile')
  .action((protoFileNames) => {
    // compile proto files
    console.log('Generating AS proto files...');
    const cmd =`yarn protoc --plugin=protoc-gen-as=${ASProtoGenPath} --as_out=. ${protoFileNames.join(' ')}`;
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit' });
  });

program.command('run-tests')
  .description('Run contract tests')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .action((contractFolderPath) => {
    console.log('Running tests...');
    let cmd = `yarn asp --verbose --config ${contractFolderPath}/as-pect.config.js`;
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit' });
  });

program.parse();