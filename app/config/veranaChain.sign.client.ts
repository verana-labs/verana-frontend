'use client'

import { AminoTypes } from "@cosmjs/stargate";
import { Registry } from '@cosmjs/proto-signing'
import { MsgAddDIDAminoConverter, MsgRemoveDIDAminoConverter, MsgRenewDIDAminoConverter, MsgTouchDIDAminoConverter } 
        from '@/msg/amino-converter/aminoConvertersDID';
import { MsgReclaimTrustDepositAminoConverter, MsgReclaimTrustDepositYieldAminoConverter, MsgRepaySlashedTrustDepositAminoConverter } 
        from '@/msg/amino-converter/aminoConvertersTD';
import { MsgCreateTrustRegistryAminoConverter, MsgUpdateTrustRegistryAminoConverter, MsgArchiveTrustRegistryAminoConverter, MsgIncreaseActiveGovernanceFrameworkVersionAminoConverter, MsgAddGovernanceFrameworkDocumentAminoConverter } 
        from '@/msg/amino-converter/aminoConvertersTR';
import { MsgArchiveCredentialSchemaAminoConverter, MsgCreateCredentialSchemaAminoConverter, MsgUpdateCredentialSchemaAminoConverter } 
        from '@/msg/amino-converter/aminoConvertersCS';
import {
  MsgStartPermissionVPAminoConverter,
  MsgRenewPermissionVPAminoConverter,
  MsgSetPermissionVPToValidatedAminoConverter,
  MsgCancelPermissionVPLastRequestAminoConverter,
  MsgCreateRootPermissionAminoConverter,
  MsgExtendPermissionAminoConverter,
  MsgRevokePermissionAminoConverter,
  MsgCreateOrUpdatePermissionSessionAminoConverter,
  MsgSlashPermissionTrustDepositAminoConverter,
  MsgRepayPermissionSlashedTrustDepositAminoConverter,
  MsgCreatePermissionAminoConverter,
} from '@/msg/amino-converter/aminoConvertersPerm';
import { MsgAddDID, MsgRemoveDID, MsgRenewDID, MsgTouchDID } from 'proto-codecs/codec/verana/dd/v1/tx';
import { MsgReclaimTrustDeposit, MsgReclaimTrustDepositYield, MsgRepaySlashedTrustDeposit } from 'proto-codecs/codec/verana/td/v1/tx';
import { MsgAddGovernanceFrameworkDocument, MsgArchiveTrustRegistry, MsgCreateTrustRegistry, MsgIncreaseActiveGovernanceFrameworkVersion, MsgUpdateTrustRegistry } from 'proto-codecs/codec/verana/tr/v1/tx';
import { MsgCreateCredentialSchema, MsgUpdateCredentialSchema, MsgArchiveCredentialSchema } from "proto-codecs/codec/verana/cs/v1/tx";
import {
  MsgStartPermissionVP,
  MsgRenewPermissionVP,
  MsgSetPermissionVPToValidated,
  MsgCancelPermissionVPLastRequest,
  MsgCreateRootPermission,
  MsgExtendPermission,
  MsgRevokePermission,
  MsgCreateOrUpdatePermissionSession,
  MsgSlashPermissionTrustDeposit,
  MsgRepayPermissionSlashedTrustDeposit,
  MsgCreatePermission,
} from 'proto-codecs/codec/verana/perm/v1/tx';

export const veranaRegistry = new Registry([
        // ...defaultRegistryTypes,
        // verana.dd.v1
        ["/verana.dd.v1.MsgAddDID", MsgAddDID],
        ["/verana.dd.v1.MsgRenewDID", MsgRenewDID],
        ["/verana.dd.v1.MsgTouchDID", MsgTouchDID],
        ["/verana.dd.v1.MsgRemoveDID", MsgRemoveDID],
        // verana.td.v1
        ["/verana.td.v1.MsgReclaimTrustDepositYield", MsgReclaimTrustDepositYield],
        ["/verana.td.v1.MsgReclaimTrustDeposit", MsgReclaimTrustDeposit],
        ["/verana.td.v1.MsgRepaySlashedTrustDeposit", MsgRepaySlashedTrustDeposit],
        // verana.tr.v1
        ["/verana.tr.v1.MsgCreateTrustRegistry", MsgCreateTrustRegistry],
        ["/verana.tr.v1.MsgUpdateTrustRegistry", MsgUpdateTrustRegistry],
        ["/verana.tr.v1.MsgArchiveTrustRegistry", MsgArchiveTrustRegistry],
        ["/verana.tr.v1.MsgAddGovernanceFrameworkDocument", MsgAddGovernanceFrameworkDocument],
        ["/verana.tr.v1.MsgIncreaseActiveGovernanceFrameworkVersion", MsgIncreaseActiveGovernanceFrameworkVersion],
        // verana.cs.v1
        ["/verana.cs.v1.MsgCreateCredentialSchema", MsgCreateCredentialSchema],
        ["/verana.cs.v1.MsgUpdateCredentialSchema", MsgUpdateCredentialSchema],
        ["/verana.cs.v1.MsgArchiveCredentialSchema", MsgArchiveCredentialSchema],
        // verana.perm.v1
        ["/verana.perm.v1.MsgStartPermissionVP", MsgStartPermissionVP],
        ["/verana.perm.v1.MsgRenewPermissionVP", MsgRenewPermissionVP],
        ["/verana.perm.v1.MsgSetPermissionVPToValidated", MsgSetPermissionVPToValidated],
        ["/verana.perm.v1.MsgCancelPermissionVPLastRequest", MsgCancelPermissionVPLastRequest],
        ["/verana.perm.v1.MsgCreateRootPermission", MsgCreateRootPermission],
        ["/verana.perm.v1.MsgExtendPermission", MsgExtendPermission],
        ["/verana.perm.v1.MsgRevokePermission", MsgRevokePermission],
        ["/verana.perm.v1.MsgCreateOrUpdatePermissionSession", MsgCreateOrUpdatePermissionSession],
        ["/verana.perm.v1.MsgSlashPermissionTrustDeposit", MsgSlashPermissionTrustDeposit],
        ["/verana.perm.v1.MsgRepayPermissionSlashedTrustDeposit", MsgRepayPermissionSlashedTrustDeposit],
        ["/verana.perm.v1.MsgCreatePermission", MsgCreatePermission]
]);
  
export const veranaAmino = new AminoTypes({
        // verana.dd.v1
        '/verana.dd.v1.MsgAddDID': MsgAddDIDAminoConverter,
        '/verana.dd.v1.MsgRenewDID': MsgRenewDIDAminoConverter,
        '/verana.dd.v1.MsgTouchDID': MsgTouchDIDAminoConverter,
        '/verana.dd.v1.MsgRemoveDID': MsgRemoveDIDAminoConverter,
        // verana.td.v1
        '/verana.td.v1.MsgReclaimTrustDepositYield': MsgReclaimTrustDepositYieldAminoConverter,
        '/verana.td.v1.MsgReclaimTrustDeposit': MsgReclaimTrustDepositAminoConverter,
        '/verana.td.v1.MsgRepaySlashedTrustDeposit': MsgRepaySlashedTrustDepositAminoConverter,
        // verana.tr.v1
        '/verana.tr.v1.MsgCreateTrustRegistry': MsgCreateTrustRegistryAminoConverter,
        '/verana.tr.v1.MsgUpdateTrustRegistry': MsgUpdateTrustRegistryAminoConverter,
        '/verana.tr.v1.MsgArchiveTrustRegistry': MsgArchiveTrustRegistryAminoConverter,
        '/verana.tr.v1.MsgAddGovernanceFrameworkDocument': MsgAddGovernanceFrameworkDocumentAminoConverter,
        '/verana.tr.v1.MsgIncreaseActiveGovernanceFrameworkVersion': MsgIncreaseActiveGovernanceFrameworkVersionAminoConverter,
        // verana.cs.v1
        '/verana.cs.v1.MsgCreateCredentialSchema': MsgCreateCredentialSchemaAminoConverter,
        '/verana.cs.v1.MsgUpdateCredentialSchema': MsgUpdateCredentialSchemaAminoConverter,
        '/verana.cs.v1.MsgArchiveCredentialSchema': MsgArchiveCredentialSchemaAminoConverter,
        // verana.perm.v1 (NEW)
        '/verana.perm.v1.MsgStartPermissionVP': MsgStartPermissionVPAminoConverter,
        '/verana.perm.v1.MsgRenewPermissionVP': MsgRenewPermissionVPAminoConverter,
        '/verana.perm.v1.MsgSetPermissionVPToValidated': MsgSetPermissionVPToValidatedAminoConverter,
        '/verana.perm.v1.MsgCancelPermissionVPLastRequest': MsgCancelPermissionVPLastRequestAminoConverter,
        '/verana.perm.v1.MsgCreateRootPermission': MsgCreateRootPermissionAminoConverter,
        '/verana.perm.v1.MsgExtendPermission': MsgExtendPermissionAminoConverter,
        '/verana.perm.v1.MsgRevokePermission': MsgRevokePermissionAminoConverter,
        '/verana.perm.v1.MsgCreateOrUpdatePermissionSession': MsgCreateOrUpdatePermissionSessionAminoConverter,
        '/verana.perm.v1.MsgSlashPermissionTrustDeposit': MsgSlashPermissionTrustDepositAminoConverter,
        '/verana.perm.v1.MsgRepayPermissionSlashedTrustDeposit': MsgRepayPermissionSlashedTrustDepositAminoConverter,
        '/verana.perm.v1.MsgCreatePermission': MsgCreatePermissionAminoConverter,    
});

export const veranaGasPrice = '3uvna';
export const veranaGasLimit = 300000; 
export const veranaDenom = 'uvna';
export const veranaGasAdjustment = 2;

