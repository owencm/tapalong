//
//  GlobalNetwork.m
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "GlobalNetwork.h"

static GlobalNetwork *sharedGlobalInstance = nil;

@implementation GlobalNetwork

#pragma mark Singleton Methods
+ (id)sharedGlobal {
    @synchronized(self) {
        if (sharedGlobalInstance == nil)
            sharedGlobalInstance = [[self alloc] init];
    }
    return sharedGlobalInstance;
}

- (id)init {
    if (self = [super init]) {
        // Set properties required in here
    }
    return self;
}


@end
