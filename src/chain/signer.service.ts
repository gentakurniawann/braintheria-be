// signer.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';
import { QNA_ABI } from './qna.abi';

@Injectable()
export class SignerService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  contract: ethers.Contract;

  constructor() {
    // Connect to blockchain node
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.SERVER_SIGNER_PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl) throw new Error('RPC_URL missing in .env');
    if (!privateKey)
      throw new Error('SERVER_SIGNER_PRIVATE_KEY missing in .env');
    if (!contractAddress) throw new Error('CONTRACT_ADDRESS missing in .env');

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, QNA_ABI, this.signer);

    // console.log('🔍 ENV VALUES AT SIGNER START:', {
    //   RPC_URL: process.env.RPC_URL,
    //   SERVER_SIGNER_PRIVATE_KEY: process.env.SERVER_SIGNER_PRIVATE_KEY?.slice(
    //     0,
    //     10,
    //   ),
    //   CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    // });
  }

  // Optional debugging connection info
  async testConnection() {
    const network = await this.provider.getNetwork();
    // console.log(`[SignerService] Connected to chain: ${network.chainId}`);
    // console.log(
    //   `[SignerService] Using address: ${await this.signer.getAddress()}`,
    // );
  }

  getContract() {
    return this.contract;
  }

  /**
   * Ask a new question on-chain with optional ETH bounty.
   */
  async askQuestion(
    tokenAddress: string,
    bountyWei: bigint,
    deadline: number,
    uri: string,
  ) {
    try {
      // console.log(' Sending askQuestion tx...');
      // console.log(this.contract);
      // console.log('Contract address:', this.contract.address);

      const tx = await this.contract.askQuestion(
        tokenAddress,
        bountyWei,
        deadline,
        uri,
        {
          value: bountyWei,
          gasLimit: 3_000_000,
        },
      );

      // console.log(`Waiting for confirmation... TX Hash: ${tx.hash}`);
      const receipt = await tx.wait(1);

      // console.log(' Receipt:', {
      //   blockNumber: receipt?.blockNumber,
      //   status: receipt?.status,
      //   logsLength: receipt?.logs?.length,
      // });

      let emittedQId: number | null = null;

      // Try to parse logs for the event
      if (
        receipt &&
        receipt.status === 1 &&
        receipt.logs &&
        receipt.logs.length > 0
      ) {
        for (const log of receipt.logs) {
          try {
            const parsed = this.contract.interface.parseLog(log);
            if (parsed && parsed.name === 'QuestionAsked') {
              emittedQId = Number(parsed.args[0]); // questionId is first arg
              // console.log(
              //   `Event parsed: QuestionAsked => questionId=${emittedQId}`,
              // );
              break;
            }
          } catch {
            // skip unrelated logs
          }
        }
      }

      if (emittedQId === null) {
        console.warn('⚠️ Could not extract questionId from events');
      }

      return { tx, receipt, chainQId: emittedQId };
    } catch (err) {
      console.error('❌ askQuestion failed:', err);
      throw new BadRequestException('Failed to send askQuestion transaction');
    }
  }

  async fundMore(chainQId: number, addWei: bigint) {
    const tx = await this.contract.fundMore(chainQId, addWei, {
      value: addWei,
    });
    return await tx.wait();
  }

  async reduceBounty(chainQId: number, reduceWei: bigint) {
    const tx = await this.contract.reduceBounty(chainQId, reduceWei);
    return await tx.wait();
  }

  async cancelQuestion(chainQId: number) {
    const tx = await this.contract.cancelQuestion(chainQId);
    return await tx.wait();
  }

  /**
   * Reward user by accepting their answer (called by admin/backend)
   */
  async rewardUser(questionId: number, answerId: number) {
    if (!answerId) {
      throw new BadRequestException('Missing answer ID');
    }

    // console.log(
    //   Admin accepting answer ${answerId} for question ${questionId}`,
    // );

    try {
      // CRITICAL: Use acceptAnswerAsAdmin instead of acceptAnswer
      const tx = await this.contract.acceptAnswerAsAdmin(
        BigInt(questionId),
        BigInt(answerId),
      );

      // console.log(`Transaction sent: ${tx.hash}`);
      // console.log(`Waiting for confirmation...`);

      const receipt = await tx.wait();

      // console.log(`Answer accepted in block ${receipt.blockNumber}`);
      // console.log(`Transaction hash: ${receipt.hash}`);

      return receipt;
    } catch (error) {
      console.error('❌ Error in rewardUser:', error);

      // Provide helpful error messages
      if (error.message?.includes('Not asker')) {
        throw new BadRequestException(
          'You are calling acceptAnswer instead of acceptAnswerAsAdmin. ' +
            'Make sure the contract is deployed with the new function.',
        );
      }

      if (error.message?.includes('Ownable: caller is not the owner')) {
        throw new BadRequestException(
          'Backend wallet is not the contract owner. ' +
            'Redeploy the contract with your backend wallet as owner.',
        );
      }

      if (error.message?.includes('acceptAnswerAsAdmin')) {
        throw new BadRequestException(
          'Contract does not have acceptAnswerAsAdmin function. ' +
            'Please redeploy the updated contract.',
        );
      }

      if (error.message?.includes('Not open')) {
        throw new BadRequestException(
          'Question is not open (already resolved, cancelled, or expired)',
        );
      }

      if (error.message?.includes('Invalid answer')) {
        throw new BadRequestException('Invalid answer ID');
      }

      if (error.message?.includes('Already accepted')) {
        throw new BadRequestException(
          'This question already has an accepted answer',
        );
      }

      throw error;
    }
  }

  async fundBounty(questionId: number, amountWei: bigint) {
    const tx = await this.contract.fundBounty(BigInt(questionId), {
      value: amountWei,
    });
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async answerQuestion(questionId: number, contentHash: string) {
    if (!contentHash) throw new BadRequestException('Missing content hash');
    // console.log(`Posting answer for question ${questionId}`);
    const tx = await this.contract.answerQuestion(
      BigInt(questionId),
      contentHash,
    );
    return tx;
  }
}
