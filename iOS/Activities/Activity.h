//
//  Activity.h
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface Activity : NSObject

@property (strong, nonatomic) NSString *title;
@property (strong, nonatomic) NSDate *start_time;
@property (strong, nonatomic) NSString *location;
@property (strong, nonatomic) NSString *max_attendees;
@property (strong, nonatomic) NSString *description;

@end
