//
//  GlobalColors.h
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface GlobalColors : NSObject

@property (nonatomic, strong) UIColor *red;
@property (nonatomic, strong) UIImage *redImage;
@property (nonatomic, strong) UIColor *backgroundGrey;
@property (nonatomic, strong) UIColor *darkGreyText;
@property (nonatomic, strong) UIColor *lightGreyText;
@property (nonatomic, strong) GlobalColors *sharedGlobalInstance;

+ (id)sharedGlobal;

@end

