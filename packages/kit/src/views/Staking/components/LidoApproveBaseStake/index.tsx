import type { PropsWithChildren } from 'react';
import { useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import { useIntl } from 'react-intl';

import {
  Alert,
  NumberSizeableText,
  Page,
  SizableText,
  Stack,
  XStack,
  YStack,
} from '@onekeyhq/components';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { AmountInput } from '@onekeyhq/kit/src/components/AmountInput';
import { ListItem } from '@onekeyhq/kit/src/components/ListItem';
import { Token } from '@onekeyhq/kit/src/components/Token';
import { useSendConfirm } from '@onekeyhq/kit/src/hooks/useSendConfirm';
import { useSettingsPersistAtom } from '@onekeyhq/kit-bg/src/states/jotai/atoms';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import type { IToken } from '@onekeyhq/shared/types/token';

import { useTrackTokenAllowance } from '../../hooks/useUtilsHooks';
import { LIDO_LOGO_URI } from '../../utils/const';
import { ValuePriceListItem } from '../ValuePriceListItem';

type ILidoApproveBaseStakeProps = {
  price: string;
  balance: string;
  token: IToken;
  receivingTokenSymbol: string;
  approveTarget: {
    accountId: string;
    networkId: string;
    spenderAddress: string;
    token: IToken;
  };
  currentAllowance?: string;
  rate?: string;
  apr?: number;
  minAmount?: string;
  onConfirm?: (amount: string) => Promise<void>;
};

const fieldTitleProps = { color: '$textSubdued', size: '$bodyLg' } as const;

export const LidoApproveBaseStake = ({
  price,
  balance,
  token,
  receivingTokenSymbol,
  apr = 4,
  minAmount = '0',
  rate = '1',
  currentAllowance = '0',
  onConfirm,
  approveTarget,
}: PropsWithChildren<ILidoApproveBaseStakeProps>) => {
  const intl = useIntl();
  const { navigationToSendConfirm } = useSendConfirm({
    accountId: approveTarget.accountId,
    networkId: approveTarget.networkId,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [approving, setApproving] = useState<boolean>(false);
  const {
    allowance,
    loading: loadingAllowance,
    trackAllowance,
  } = useTrackTokenAllowance({
    accountId: approveTarget.accountId,
    networkId: approveTarget.networkId,
    tokenAddress: approveTarget.token.address,
    spenderAddress: approveTarget.spenderAddress,
    initialValue: currentAllowance,
  });
  const [amountValue, setAmountValue] = useState('');
  const [
    {
      currencyInfo: { symbol },
    },
  ] = useSettingsPersistAtom();

  const onChangeAmountValue = useCallback((value: string) => {
    const valueBN = new BigNumber(value);
    if (valueBN.isNaN()) {
      if (value === '') {
        setAmountValue('');
      }
      return;
    }
    setAmountValue(value);
  }, []);

  const currentValue = useMemo<string | undefined>(() => {
    const amountValueBn = new BigNumber(amountValue);
    if (amountValueBn.isNaN()) return undefined;
    return amountValueBn.multipliedBy(price).toFixed();
  }, [amountValue, price]);

  const isInsufficientBalance = useMemo<boolean>(
    () => new BigNumber(amountValue).gt(balance),
    [amountValue, balance],
  );

  const isLessThanMinAmount = useMemo<boolean>(() => {
    const minAmountBn = new BigNumber(minAmount);
    const amountValueBn = new BigNumber(amountValue);
    if (minAmountBn.isGreaterThan(0) && amountValueBn.isGreaterThan(0)) {
      return amountValueBn.isLessThan(minAmountBn);
    }
    return false;
  }, [minAmount, amountValue]);

  const isDisable = useMemo(() => {
    const amountValueBN = BigNumber(amountValue);
    return (
      amountValueBN.isNaN() ||
      amountValueBN.lte(0) ||
      isInsufficientBalance ||
      isLessThanMinAmount
    );
  }, [amountValue, isInsufficientBalance, isLessThanMinAmount]);

  const isApprove = useMemo(() => {
    const amountValueBN = BigNumber(amountValue);
    const allowanceBN = new BigNumber(allowance);
    return !amountValueBN.isNaN() && allowanceBN.lt(amountValue);
  }, [amountValue, allowance]);

  const onConfirmText = useMemo(() => {
    if (isApprove) {
      return intl.formatMessage(
        { id: ETranslations.form__approve_str },
        { amount: amountValue, symbol: token.symbol.toUpperCase() },
      );
    }
    return intl.formatMessage({ id: ETranslations.earn_stake });
  }, [isApprove, token, amountValue, intl]);

  const onApprove = useCallback(async () => {
    setApproving(true);
    const account = await backgroundApiProxy.serviceAccount.getAccount({
      accountId: approveTarget.accountId,
      networkId: approveTarget.networkId,
    });
    await navigationToSendConfirm({
      approveInfo: {
        owner: account.address,
        spender: approveTarget.spenderAddress,
        amount: amountValue,
        tokenInfo: approveTarget.token,
      },
      onSuccess(data) {
        trackAllowance(data[0].decodedTx.txid);
        setApproving(false);
      },
      onFail() {
        setApproving(false);
      },
      onCancel() {
        setApproving(false);
      },
    });
  }, [amountValue, approveTarget, navigationToSendConfirm, trackAllowance]);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    try {
      await onConfirm?.(amountValue);
    } finally {
      setLoading(false);
    }
  }, [onConfirm, amountValue]);

  const onMax = useCallback(() => {
    onChangeAmountValue(balance);
  }, [onChangeAmountValue, balance]);

  const estAnnualRewards = useMemo(() => {
    const bn = BigNumber(amountValue);
    if (!amountValue || bn.isNaN()) {
      return null;
    }
    const amountBN = BigNumber(amountValue).multipliedBy(apr).dividedBy(100);
    return (
      <ValuePriceListItem
        tokenSymbol={token.symbol}
        amount={amountBN.toFixed()}
        fiatSymbol={symbol}
        fiatValue={amountBN.multipliedBy(price).toFixed()}
      />
    );
  }, [amountValue, apr, price, symbol, token.symbol]);

  const receivingTokenAmount = useMemo<string | undefined>(() => {
    const amountValueBN = BigNumber(amountValue);
    if (amountValueBN.isNaN()) {
      return undefined;
    }
    return amountValueBN.multipliedBy(rate).toFixed();
  }, [amountValue, rate]);

  return (
    <YStack>
      <Stack mx="$2" px="$3" gap="$5">
        <AmountInput
          hasError={isInsufficientBalance || isLessThanMinAmount}
          value={amountValue}
          onChange={onChangeAmountValue}
          tokenSelectorTriggerProps={{
            selectedTokenImageUri: token.logoURI,
            selectedTokenSymbol: token.symbol.toUpperCase(),
          }}
          balanceProps={{
            value: balance,
            onPress: onMax,
          }}
          inputProps={{
            placeholder: '0',
          }}
          valueProps={{
            value: currentValue,
            currency: currentValue ? symbol : undefined,
          }}
          enableMaxAmount
        />
        <YStack>
          {isLessThanMinAmount ? (
            <Alert
              icon="InfoCircleOutline"
              type="critical"
              title={intl.formatMessage(
                { id: ETranslations.earn_minimum_amount },
                { number: `${minAmount} ${token.symbol}` },
              )}
            />
          ) : null}
          {isInsufficientBalance ? (
            <Alert
              icon="InfoCircleOutline"
              type="critical"
              title={intl.formatMessage({
                id: ETranslations.earn_insufficient_balance,
              })}
            />
          ) : null}
        </YStack>
      </Stack>
      <Stack>
        <YStack>
          {estAnnualRewards ? (
            <ListItem
              title={intl.formatMessage({
                id: ETranslations.earn_est_annual_rewards,
              })}
              titleProps={fieldTitleProps}
            >
              {estAnnualRewards}
            </ListItem>
          ) : null}
          {receivingTokenAmount ? (
            <ListItem
              title={intl.formatMessage({ id: ETranslations.earn_est_receive })}
              titleProps={fieldTitleProps}
            >
              <SizableText>
                <NumberSizeableText
                  formatter="balance"
                  size="$bodyLgMedium"
                  formatterOptions={{ tokenSymbol: receivingTokenSymbol }}
                >
                  {receivingTokenAmount}
                </NumberSizeableText>
              </SizableText>
            </ListItem>
          ) : null}
          <ListItem
            title={intl.formatMessage({ id: ETranslations.global_apr })}
            titleProps={fieldTitleProps}
          >
            <ListItem.Text
              primary={`${apr}%`}
              primaryTextProps={{ color: '$textSuccess' }}
            />
          </ListItem>
          <ListItem
            title={intl.formatMessage({ id: ETranslations.global_protocol })}
            titleProps={fieldTitleProps}
          >
            <XStack gap="$2" alignItems="center">
              <Token size="xs" tokenImageUri={LIDO_LOGO_URI} />
              <SizableText size="$bodyLgMedium">Lido</SizableText>
            </XStack>
          </ListItem>
          <ListItem
            title={intl.formatMessage({
              id: ETranslations.earn_stake_release_period,
            })}
            titleProps={fieldTitleProps}
          >
            <ListItem.Text
              primary={intl.formatMessage(
                { id: ETranslations.earn_less_than_number_days },
                { number: 4 },
              )}
            />
          </ListItem>
        </YStack>
      </Stack>
      <Page.Footer
        onConfirmText={onConfirmText}
        confirmButtonProps={{
          onPress: isApprove ? onApprove : onSubmit,
          loading: loading || loadingAllowance || approving,
          disabled: isDisable,
        }}
      />
    </YStack>
  );
};
