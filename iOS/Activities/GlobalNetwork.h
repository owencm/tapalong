//
//  GlobalNetwork.h
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface GlobalNetwork : NSObject

@property (nonatomic, strong) GlobalNetwork *sharedGlobalInstance;

+ (id)sharedGlobal;

@end

