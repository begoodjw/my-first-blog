from .models import *

tv_channels = ['KBS1', 'KBS2', 'tvN', 'JTBC', 'MBC', 'SBS',
               'TV조선', 'MBN', '채널A', 'Mnet', 'XtvN', 'NQQ', 'SKY']


class BroadCaster:
    def get_tv_service(self, channel_name):
        if channel_name == 'KBS1':
            return KBS1Service
        elif channel_name == 'KBS2':
            return KBS2Service
        elif channel_name == 'tvN':
            return TVNService
        elif channel_name == 'JTBC':
            return JTBCService
        elif channel_name == 'MBC':
            return MBCService
        elif channel_name == 'SBS':
            return SBSService
        elif channel_name == 'TV조선':
            return TVChosunService
        elif channel_name == 'MBN':
            return MBNService
        elif channel_name == '채널A':
            return ChannelAService
        elif channel_name == 'Mnet':
            return MnetService
        elif channel_name == 'XtvN':
            return TvnShowService
        elif channel_name == 'NQQ':
            return NQQService
        elif channel_name == 'SKY':
            return SkyService
        else:
            return ChannelService1

    def get_tv_permission(self, channel_name):
        if channel_name == 'KBS1':
            return 'chat.add_kbs1service'
        elif channel_name == 'KBS2':
            return 'chat.add_kbs2service'
        elif channel_name == 'tvN':
            return 'chat.add_tvnservice'
        elif channel_name == 'JTBC':
            return 'chat.add_jtbcservice'
        elif channel_name == 'MBC':
            return 'chat.add_mbcservice'
        elif channel_name == 'SBS':
            return 'chat.add_sbsservice'
        else:
            return 'chat.add_channelservice1'


def get_tv_service(channel_name):
    if channel_name == 'KBS1':
        return KBS1Service
    elif channel_name == 'KBS2':
        return KBS2Service
    elif channel_name == 'tvN':
        return TVNService
    elif channel_name == 'JTBC':
        return JTBCService
    elif channel_name == 'MBC':
        return MBCService
    elif channel_name == 'SBS':
        return SBSService
    elif channel_name == 'TV조선':
        return TVChosunService
    elif channel_name == 'MBN':
        return MBNService
    elif channel_name == '채널A':
        return ChannelAService
    elif channel_name == 'Mnet':
        return MnetService
    elif channel_name == 'XtvN':
        return TvnShowService
    elif channel_name == 'OCN':
        return OCNService
    elif channel_name == 'NQQ':
        return NQQService
    elif channel_name == 'SKY':
        return SkyService
    else:
        return ChannelService1


def get_tv_permission(channel_name):
    if channel_name == 'KBS1':
        return 'chat.add_kbs1service'
    elif channel_name == 'KBS2':
        return 'chat.add_kbs2service'
    elif channel_name == 'tvN':
        return 'chat.add_tvnservice'
    elif channel_name == 'JTBC':
        return 'chat.add_jtbcservice'
    elif channel_name == 'MBC':
        return 'chat.add_mbcservice'
    elif channel_name == 'SBS':
        return 'chat.add_sbsservice'
    elif channel_name == 'TV조선':
        return 'chat.add_tvchosunservice'
    elif channel_name == 'MBN':
        return 'chat.add_mbnservice'
    elif channel_name == '채널A':
        return 'chat.add_channelaservice'
    elif channel_name == 'Mnet':
        return 'chat.add_mnetservice'
    elif channel_name == 'XtvN':
        return 'chat.add_svnshowservice'
    elif channel_name == 'NQQ':
        return 'chat.add_nqqservice'
    elif channel_name == 'SKY':
        return 'chat.add_skyservice'
    elif channel_name == 'OCN':
        return 'chat.add_ocnservice'
    else:
        return 'chat.add_channelservice1'


def get_all_tv_services():
    return [KBS1Service, KBS2Service, TVNService, JTBCService, MBCService, SBSService, ChannelService1]
