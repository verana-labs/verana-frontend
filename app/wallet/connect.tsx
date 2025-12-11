'use client';

import { MouseEventHandler } from "react";
import { Button as UIButton, IconName } from "@interchain-ui/react";
import { resolveTranslatable } from "@/ui/dataview/types";
import { translate } from "@/i18n/dataview";

export type ButtonProps = {
  text?: string;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export type ConnectProps = Pick<ButtonProps, "text" | "loading" | "onClick">;

function noop() {}

export default function Button({
  text,
  // icon,
  loading,
  disabled,
  onClick = noop,
}: ButtonProps) {
  return (
    <UIButton
      onClick={onClick}
      disabled={disabled}
      isLoading={loading}
    >
      <span>{text}</span>
    </UIButton>
  );
}

export const ButtonConnect = (
  { text = resolveTranslatable({key: 'wallet.nav.connect'}, translate), onClick = noop }: ConnectProps,
) => <Button text={text} onClick={onClick} />;

export const ButtonConnected = (
  { text = resolveTranslatable({key: 'wallet.wallet'}, translate), onClick = noop }: ConnectProps,
) => <Button text={text} icon="walletFilled" onClick={onClick} />;

export const ButtonDisconnected = (
  { text = resolveTranslatable({key: 'wallet.nav.connect'}, translate), onClick = noop }: ConnectProps,
) => <Button text={text} icon="walletFilled" onClick={onClick} />;

export const ButtonConnecting = (
  { text = resolveTranslatable({key: 'wallet.connecting'}, translate), loading = true }: ConnectProps,
) => <Button text={text} loading={loading} />;

export const ButtonRejected = (
  { text = resolveTranslatable({key: 'wallet.reconnect'}, translate), onClick = noop }: ConnectProps,
) => <Button text={text} icon="walletFilled" onClick={onClick} />;

export const ButtonError = (
  { text = resolveTranslatable({key: 'wallet.change'}, translate), onClick = noop }: ConnectProps,
) => <Button text={text} icon="walletFilled" onClick={onClick} />;

export const ButtonNotExist = (
  { text = resolveTranslatable({key: 'wallet.install'}, translate), onClick = noop }: ConnectProps,
) => <Button text={text} icon="walletFilled" onClick={onClick} />;
