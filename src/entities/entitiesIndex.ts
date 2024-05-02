import { AccountDeletion } from './account.deletion.entity';
import { Account } from './account.entity';
import { Address } from './address.entity';
import { Autoconvert } from './autoconvert.entity';
import { AutomaticBuy } from './automatic.buy.entity';
import { BankAccount } from './bank.account.entity';
import { Bank } from './bank.entity';
import { Nit } from './bill.entity';
import { Coin } from './coin.entity';
import { IbexAccount } from './ibex.account.entity';
import { Period } from './period.entity';
import { Preference } from './preference.entity';
import { PushToken } from './push.token.entity';
import { RecurrentBuy } from './recurrent.buy.entity';
import { Referral } from './referral.entity';
import { Role } from './role.entity';
import { UserRole } from './roleUser.entity';
import { Setting } from './setting.entity';
import { Transaction } from './transaction.entity';
import { User } from './user.entity';
import { Verification } from './verification.entity';
import { Wallet } from './wallet.entity';
import { AuthToken } from './auth.token.entity';
import { Session } from './session.entity';
import { App } from './app.entity';
import { Otp } from './otp.entity';
import { IbexToken } from './ibexToken.entity';
import { TransactionDetail } from './transaction.detail.entity';
import { TransactionGroup } from './transactionGroup.entity';
import { Country } from './country.entity';
import { CountryFunding } from './countryFunding.entity';
import { CountryWithdraw } from './countryWithdraw.entity';
import { FundingMethod } from './fundingMethod.entity';
import { WithdrawalMethod } from './withdrawalMethod.entity';
import { Tier } from './tier.entity';
import { TierUser } from './tierUser.entity';
import { CashpakToken } from './cashpakTokens.entity';
import { CashpakUser } from './cashpakUsers.entity';
import { HistoricRate } from './historicRates.entity';
import { PartnerToken } from './partnerTokens.entity';
import { PartnerConfig } from './strikeConfig.entity';
import { HistoricCoinRate } from './historicCoinRate.entity';
import { OsmoBankAccount } from './osmoBank.entity';
import { OsmoBusinessBpt } from './osmoBusinessBPT.entity';
import { Feature } from './feature.entity';
import { FeaturePlatform } from './featurePlatform.entity';
import { WithdrawalMethodCoin } from './withdrawalMethodCoin.entity';
import { FundingMethodCoin } from './fundingMethodCoin.entity';
import { TransactionFee } from './transactionFee.entity';
import { UserTransactionLimit } from './userTransactionLimit.entity';
import { FeatureCountry } from './featureCountry.entity';
import { TierFeature } from './tierFeature.entity';
import { BlockchainNetwork } from './blockchainNetworks.entity';
import { BlockchainNetworkAddress } from './userBlockchainNetworkAddress.entity';
import { GlobalPayment } from './globalPayment.entity';
import { GlobalPaymentCountry } from './globalPaymentCountry.entity';
import { WalletHistory } from './walletHistory.entity';
import { TransactionCategory } from './transactionCategory.entity';
import { CountryCoin } from './countryCoin.entity';

export default [
    User,
    Role,
    UserRole,
    Coin,
    Verification,
    IbexAccount,
    Bank,
    BankAccount,
    OsmoBankAccount,
    Address,
    Nit,
    Autoconvert,
    AutomaticBuy,
    RecurrentBuy,
    AccountDeletion,
    Period,
    Preference,
    PushToken,
    Setting,
    Account,
    Wallet,
    WalletHistory,
    TransactionCategory,
    TransactionGroup,
    Transaction,
    TransactionDetail,
    TransactionFee,
    Referral,
    AuthToken,
    Session,
    App,
    Otp,
    IbexToken,
    Country,
    CountryFunding,
    CountryWithdraw,
    FundingMethod,
    WithdrawalMethod,
    WithdrawalMethod,
    CashpakToken,
    CashpakUser,
    HistoricRate,
    HistoricCoinRate,
    PartnerToken,
    PartnerConfig,
    OsmoBusinessBpt,
    Feature,
    FeaturePlatform,
    FeatureCountry,
    WithdrawalMethodCoin,
    FundingMethodCoin,
    UserTransactionLimit,
    Tier,
    TierUser,
    TierFeature,
    BlockchainNetwork,
    BlockchainNetworkAddress,
    GlobalPayment,
    GlobalPaymentCountry,
    CountryCoin,
];
