//
//  GlobalColors.h
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface GlobalColors : NSObject

@property (nonatomic, strong) UIColor *redColor;
@property (nonatomic, strong) UIImage *redImage;
@property (nonatomic, strong) UIColor *backgroundGreyColor;
@property (nonatomic, strong) UIImage *backgroundGreyImage;
@property (nonatomic, strong) UIColor *textDarkGreyColor;
@property (nonatomic, strong) UIColor *textLightGreyColor;
@property (nonatomic, strong) UIColor *textBlueColor;
@property (nonatomic, strong) GlobalColors *sharedGlobalInstance;

+ (id)sharedGlobal;

@end

