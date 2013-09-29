//
//  GlobalNetwork.h
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//
//  This could probably be a static class rather than a singleton but this leaves flexibility.
//

#import <Foundation/Foundation.h>
#import "Activity.h"

// A good guide on blocks: http://pragmaticstudio.com/blog/2010/9/15/ios4-blocks-2
typedef void (^GetActivitiesCallbackBlock)(NSArray *);

@interface GlobalNetwork : NSObject

@property (nonatomic, strong) GlobalNetwork *sharedGlobalInstance;

+ (id)sharedGlobal;
- (void)getActivities:(GetActivitiesCallbackBlock)successHandler;
- (void)createActivity:(Activity *)activity;

@end

