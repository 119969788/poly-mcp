import dotenv from 'dotenv';
import { ClobClient } from '@polymarket/clob-client';
import { Wallet } from 'ethers';

// 加载环境变量
dotenv.config();

/**
 * 生成或获取 Polymarket API 凭证
 * 参考官方文档: https://docs.polymarket.com/quickstart/first-order
 * 
 * 完整流程：
 * 1. 使用私钥初始化客户端
 * 2. 派生用户 API 凭证
 * 3. 配置签名类型和资金地址
 * 4. 使用完整认证重新初始化客户端（验证）
 */
async function generateApiKey() {
  try {
    console.log('='.repeat(60));
    console.log('Polymarket API 凭证生成工具');
    console.log('参考: https://docs.polymarket.com/quickstart/first-order');
    console.log('='.repeat(60));
    
    // 步骤 1: 检查私钥
    if (!process.env.PRIVATE_KEY) {
      throw new Error('请先在 .env 文件中设置 PRIVATE_KEY');
    }

    // Polymarket 配置
    const HOST = process.env.POLYMARKET_HOST || 'https://clob.polymarket.com';
    const CHAIN_ID = parseInt(process.env.CHAIN_ID || '137'); // Polygon 主网

    console.log('\n📋 步骤 1: 初始化客户端（使用私钥）');
    console.log(`   主机: ${HOST}`);
    console.log(`   链 ID: ${CHAIN_ID} (Polygon 主网)`);

    // 创建签名者
    const signer = new Wallet(process.env.PRIVATE_KEY);
    console.log(`   钱包地址: ${signer.address}`);

    // 初始化客户端（仅使用私钥，不包含 API 凭证）
    const client = new ClobClient(HOST, CHAIN_ID, signer);
    console.log('   ✅ 客户端初始化成功');

    // 步骤 2: 派生用户 API 凭证
    console.log('\n📋 步骤 2: 派生用户 API 凭证');
    console.log('   使用私钥派生 API 凭证（如果已存在则获取现有凭证）...');
    
    let userApiCreds;
    try {
      // 根据官方文档，使用 createOrDeriveApiKey 方法
      userApiCreds = await client.createOrDeriveApiKey();
      console.log('   ✅ API 凭证派生成功');
    } catch (error) {
      console.error('   ❌ API 凭证派生失败:', error.message);
      
      // 如果是方法不存在，提供详细错误信息
      if (error.message.includes('is not a function')) {
        console.log('\n💡 可能的原因:');
        console.log('   1. @polymarket/clob-client 版本不匹配');
        console.log('   2. 请确保安装最新版本: npm install @polymarket/clob-client@latest');
        console.log('   3. 检查当前版本: npm list @polymarket/clob-client');
        console.log('\n🔍 调试信息:');
        const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
          .filter(name => typeof client[name] === 'function' && !name.startsWith('_'));
        console.log('   可用的方法:', availableMethods.slice(0, 10).join(', '), '...');
      }
      throw error;
    }
    
    // 验证返回的数据结构
    if (!userApiCreds) {
      throw new Error('API 凭证派生返回空值');
    }
    
    // 根据官方文档，返回的字段应该是 apiKey, secret, passphrase
    const apiKey = userApiCreds.apiKey;
    const secret = userApiCreds.secret;
    const passphrase = userApiCreds.passphrase;
    
    if (!apiKey || !secret || !passphrase) {
      console.error('   ❌ API 凭证格式不正确');
      console.error('   返回的数据:', JSON.stringify(userApiCreds, null, 2));
      throw new Error('API 凭证不完整，缺少必要字段 (apiKey, secret, passphrase)');
    }
    
    console.log('\n✅ API 凭证生成成功！');
    console.log('\n📋 步骤 3: 配置签名类型和资金地址');
    console.log('\n签名类型说明:');
    console.log('   0 = EOA (外部拥有账户，自己支付 gas，资金在钱包中)');
    console.log('   1 = POLY_PROXY (通过 Polymarket.com 账户交易，Magic Link/Google 登录)');
    console.log('   2 = GNOSIS_SAFE (通过 Polymarket.com 账户交易，浏览器钱包连接)');
    
    // 确定签名类型和资金地址
    const SIGNATURE_TYPE = parseInt(process.env.SIGNATURE_TYPE || '0');
    const FUNDER_ADDRESS = process.env.FUNDER_ADDRESS || signer.address;

    console.log(`\n当前配置:`);
    console.log(`   签名类型: ${SIGNATURE_TYPE} ${SIGNATURE_TYPE === 0 ? '(EOA)' : SIGNATURE_TYPE === 1 ? '(POLY_PROXY)' : '(GNOSIS_SAFE)'}`);
    console.log(`   资金地址: ${FUNDER_ADDRESS}`);
    
    if (SIGNATURE_TYPE === 0 && FUNDER_ADDRESS !== signer.address) {
      console.log('   ⚠️  警告: EOA 类型的资金地址应该等于钱包地址');
    }

    // 步骤 4: 使用完整认证重新初始化客户端（验证配置）
    console.log('\n📋 步骤 4: 使用完整认证重新初始化客户端（验证）');
    try {
      const fullClient = new ClobClient(
        HOST,
        CHAIN_ID,
        signer,
        userApiCreds,
        SIGNATURE_TYPE,
        FUNDER_ADDRESS
      );
      console.log('   ✅ 完整认证客户端初始化成功');
    } catch (error) {
      console.error('   ⚠️  完整认证客户端初始化失败:', error.message);
      console.log('   💡 这可能是正常的，如果只是生成 API 凭证，可以忽略此错误');
    }

    // 输出结果
    console.log('\n' + '='.repeat(60));
    console.log('📝 请将以下信息添加到 .env 文件中：');
    console.log('='.repeat(60));
    console.log(`POLYMARKET_API_KEY=${apiKey}`);
    console.log(`POLYMARKET_API_SECRET=${secret}`);
    console.log(`POLYMARKET_API_PASSPHRASE=${passphrase}`);
    console.log(`SIGNATURE_TYPE=${SIGNATURE_TYPE}`);
    console.log(`FUNDER_ADDRESS=${FUNDER_ADDRESS}`);
    console.log('='.repeat(60));
    
    console.log('\n💡 重要提示:');
    console.log('   1. 这些 API 凭证是用户凭证，用于身份验证');
    console.log('   2. 不要将 Builder API 凭证与用户 API 凭证混淆');
    console.log('   3. 如果使用 POLY_PROXY (类型 1) 或 GNOSIS_SAFE (类型 2)，');
    console.log('      需要从 Polymarket.com 账户获取代理钱包地址');
    console.log('   4. 确保资金地址中有足够的 USDCe 用于交易');
    console.log('   5. 确保已设置必要的代币授权（approvals）');
    
    console.log('\n📚 下一步:');
    console.log('   1. 将上面的配置添加到 .env 文件');
    console.log('   2. 运行 npm start 启动交易程序');
    console.log('   3. 参考文档: https://docs.polymarket.com/quickstart/first-order');
    
    console.log('\n✅ API 凭证生成流程完成！');
    console.log('='.repeat(60));

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
    console.error('   4. @polymarket/clob-client 版本是否正确');
    process.exit(1);
  }
}

// 运行
generateApiKey().catch(console.error);
