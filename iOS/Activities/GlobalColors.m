//
//  GlobalColors.m
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "GlobalColors.h"

static GlobalColors *sharedGlobalInstance = nil;

@implementation GlobalColors

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
        self.backgroundGreyColor = [UIColor colorWithRed:0.94 green:0.94 blue:0.94 alpha:1];
        self.backgroundGreyImage = [UIImage imageNamed:@"backgroundGrey.png"];
        self.redImage = [UIImage imageNamed:@"red.png"];
        self.redColor = [UIColor colorWithRed:231/255.0f green:76/255.0f blue:60/255.0f alpha:1];
        
        // Colors for text
        self.textDarkGreyColor = [UIColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1];
        self.textLightGreyColor = [UIColor colorWithRed:0.2 green:0.2 blue:0.2 alpha:1];
        self.textBlueColor= [UIColor colorWithRed:63/255.0f green:172/255.0f blue:221/255.0f alpha:1];
    }
    return self;
}


@end
