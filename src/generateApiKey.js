import dotenv from 'dotenv';
import { ClobClient } from '@polymarket/clob-client';
import { Wallet } from 'ethers';

// 加载环境变量
dotenv.config();

/**
 * 生成或获取 Polymarket API 凭证
 * 参考: https://docs.polymarket.com/quickstart/first-order
 */
async function generateApiKey() {
  try {
    // 检查私钥
    if (!process.env.PRIVATE_KEY) {
      throw new Error('请先在 .env 文件中设置 PRIVATE_KEY');
    }

    // Polymarket 配置
    const HOST = process.env.POLYMARKET_HOST || 'https://clob.polymarket.com';
    const CHAIN_ID = parseInt(process.env.CHAIN_ID || '137'); // Polygon 主网

    console.log('🔑 初始化客户端...');
    console.log(`   主机: ${HOST}`);
    console.log(`   链 ID: ${CHAIN_ID}`);

    // 创建签名者
    const signer = new Wallet(process.env.PRIVATE_KEY);
    console.log(`   钱包地址: ${signer.address}`);

    // 初始化客户端
    const client = new ClobClient(HOST, CHAIN_ID, signer);

    // 生成或获取 API 凭证
    console.log('\n📝 正在生成/获取 API 凭证...');
    
    // 检查可用的方法并尝试生成 API 密钥
    let userApiCreds;
    
    // 列出所有可用方法用于调试
    const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
      .filter(name => typeof client[name] === 'function' && !name.startsWith('_'));
    console.log('🔍 可用的客户端方法:', availableMethods.join(', '));
    
    // 尝试不同的方法名
    if (typeof client.createOrDeriveApiKey === 'function') {
      console.log('使用 createOrDeriveApiKey 方法...');
      userApiCreds = await client.createOrDeriveApiKey();
    } else if (typeof client.createApiKey === 'function') {
      console.log('使用 createApiKey 方法...');
      userApiCreds = await client.createApiKey();
    } else if (typeof client.deriveApiKey === 'function') {
      console.log('使用 deriveApiKey 方法...');
      userApiCreds = await client.deriveApiKey();
    } else if (typeof client.getApiKey === 'function') {
      console.log('使用 getApiKey 方法...');
      userApiCreds = await client.getApiKey();
    } else {
      // 如果都没有找到，尝试手动生成
      console.log('⚠️  未找到标准的 API 密钥生成方法');
      console.log('💡 提示: 某些版本的 clob-client 可能需要手动配置 API 密钥');
      console.log('   请参考: https://docs.polymarket.com/clob-client');
      console.log('\n你可以:');
      console.log('   1. 从 Polymarket.com 账户获取 API 密钥');
      console.log('   2. 或者手动设置以下环境变量:');
      console.log('      POLYMARKET_API_KEY=your_key');
      console.log('      POLYMARKET_API_SECRET=your_secret');
      console.log('      POLYMARKET_API_PASSPHRASE=your_passphrase');
      
      // 返回一个提示对象而不是抛出错误
      return {
        error: 'API_KEY_GENERATION_NOT_AVAILABLE',
        message: '请手动配置 API 凭证或从 Polymarket.com 获取',
        walletAddress: signer.address
      };
    }

    console.log('\n✅ API 凭证生成成功！');
    console.log('\n请将以下信息添加到 .env 文件中：');
    console.log('='.repeat(50));
    console.log(`POLYMARKET_API_KEY=${userApiCreds.apiKey}`);
    console.log(`POLYMARKET_API_SECRET=${userApiCreds.secret}`);
    console.log(`POLYMARKET_API_PASSPHRASE=${userApiCreds.passphrase}`);
    console.log('='.repeat(50));

    // 确定签名类型和资金地址
    console.log('\n📋 签名类型配置：');
    console.log('   0 = EOA (外部拥有账户，自己支付 gas)');
    console.log('   1 = POLY_PROXY (通过 Polymarket.com 账户交易)');
    console.log('   2 = GNOSIS_SAFE (Gnosis Safe 钱包)');
    
    const SIGNATURE_TYPE = parseInt(process.env.SIGNATURE_TYPE || '0');
    const FUNDER_ADDRESS = process.env.FUNDER_ADDRESS || signer.address;

    console.log(`\n当前配置:`);
    console.log(`   签名类型: ${SIGNATURE_TYPE}`);
    console.log(`   资金地址: ${FUNDER_ADDRESS}`);

    // 使用完整凭证重新初始化客户端
    const apiCreds = {
      apiKey: apiKey,
      secret: secret,
      passphrase: passphrase
    };
    
    const fullClient = new ClobClient(
      HOST,
      CHAIN_ID,
      signer,
      apiCreds,
      SIGNATURE_TYPE,
      FUNDER_ADDRESS
    );

    console.log('\n✅ 客户端初始化完成！');
    console.log('\n💡 提示:');
    console.log('   1. 将上面的 API 凭证添加到 .env 文件');
    console.log('   2. 如果使用 POLY_PROXY，需要从 Polymarket.com 账户获取代理钱包地址');
    console.log('   3. 确保钱包中有足够的 USDC 用于交易');

    return {
      apiKey: apiKey,
      secret: secret,
      passphrase: passphrase,
      signatureType: SIGNATURE_TYPE,
      funderAddress: FUNDER_ADDRESS,
      walletAddress: signer.address
    };

  } catch (error) {
    console.error('\n❌ 生成 API 凭证失败:', error.message);
    console.error('\n请检查:');
    console.error('   1. .env 文件中是否设置了 PRIVATE_KEY');
    console.error('   2. 私钥格式是否正确（0x 开头）');
    console.error('   3. 网络连接是否正常');
    process.exit(1);
  }
}

// 运行
generateApiKey().catch(console.error);
